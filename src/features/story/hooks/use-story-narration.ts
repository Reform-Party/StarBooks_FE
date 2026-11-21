import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';
import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { requestNarration } from '@/features/story/api/narration-api';
import { fetchStory } from '@/features/story/api/story-api';
import type { Story } from '@/features/story/api/types';

const POLL_MS = 3_000;
const WAIT_MS = 120_000;
const subscribeAppState = (onChange: () => void) => {
  const subscription = AppState.addEventListener('change', onChange);
  return () => subscription.remove();
};
const isActive = () => AppState.currentState === 'active';
const needsNarration = (story?: Story) => Boolean(story?.pages.some((page) => !page.ttsUrl));

export function useStoryNarration(id: string | null, story?: Story) {
  const client = useQueryClient();
  const focused = useIsFocused();
  const active = useSyncExternalStore(subscribeAppState, isActive, () => true);
  const missing = id !== null && needsNarration(story);
  // 동화별 접수 결과를 캐시해 재진입·동시 구독에도 POST를 한 번만 보내요.
  // 자동 재시도는 꺼요. 로그아웃 시 QueryClient.clear()로 계정과 함께 비워져요.
  const generation = useQuery({
    queryKey: ['story-narration-request', id],
    queryFn: () => requestNarration(id!),
    enabled: (query) =>
      active && focused && id !== null && missing && query.state.status !== 'error',
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    retryOnMount: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const completion = useQuery({
    queryKey: ['story-narration-result', id, generation.data],
    queryFn: async ({ signal }) => {
      const next = await fetchStory(id!, signal);
      client.setQueryData(['story', id], next);
      return { story: next, timedOut: Date.now() - generation.data! >= WAIT_MS };
    },
    enabled: active && focused && id !== null && generation.isSuccess && missing,
    refetchInterval: (query) =>
      query.state.status === 'error' ||
      query.state.data?.timedOut ||
      (query.state.data && !needsNarration(query.state.data.story))
        ? false
        : POLL_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
  const error = generation.error ?? completion.error;
  const timedOut = missing && completion.data?.timedOut;
  const pending = missing && !error && !timedOut;
  return {
    pages: completion.data?.story.pages ?? story?.pages,
    message: !missing
      ? undefined
      : error
        ? `${error.message} 목소리를 등록하지 않았다면 설정에서 등록해 주세요.`
        : timedOut
          ? '음성 생성이 오래 걸리고 있어요. 다시 확인해 주세요.'
          : '목소리를 만들고 있어요',
    pending,
    onRetry:
      error || timedOut
        ? async () => {
            // 응답 유실 후 중복 생성을 막기 위해 먼저 완성된 음성을 확인해요.
            const result = await completion.refetch();
            if (result.isSuccess && needsNarration(result.data.story) && generation.isError) {
              await generation.refetch();
            }
          }
        : undefined,
  };
}

export type StoryNarration = ReturnType<typeof useStoryNarration>;
