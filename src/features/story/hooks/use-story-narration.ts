import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';
import { useRef, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { fetchNarration, requestNarration } from '@/features/story/api/narration-api';
import { fetchStory } from '@/features/story/api/story-api';
import type { Story, StoryPage } from '@/features/story/api/types';

const POLL_MS = 3_000;
const WAIT_MS = 120_000;
const subscribeAppState = (onChange: () => void) => {
  const subscription = AppState.addEventListener('change', onChange);
  return () => subscription.remove();
};
const isActive = () => AppState.currentState === 'active';
const needsNarration = (pages?: StoryPage[]) => Boolean(pages?.some((page) => !page.ttsUrl));

export function useStoryNarration(id: string | null, story?: Story, canGenerate = true) {
  const focused = useIsFocused();
  const active = useSyncExternalStore(subscribeAppState, isActive, () => true);
  const [requested, setRequested] = useState<{ id: string; at: number } | null>(null);
  const requestedAt = requested?.id === id ? requested.at : null;
  const requestLock = useRef(false);
  const generation = useQuery({
    queryKey: ['story-narration-request', id],
    queryFn: () => requestNarration(id!),
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });
  const completion = useQuery({
    queryKey: ['story-narration-result', id, story?.pages.map((page) => page.paragraphId)],
    queryFn: async ({ signal }) => {
      // 문단 ID를 생략하는 기존 서버에서는 상세 URL 갱신으로 완료를 확인해요.
      const latest = story!.pages.some((page) => !page.paragraphId && !page.ttsUrl)
        ? await fetchStory(id!, signal)
        : story!;
      return {
        pages: await Promise.all(latest.pages.map((page) => fetchNarration(page, signal))),
        checkedAt: Date.now(),
      };
    },
    enabled: active && focused && id !== null && Boolean(story?.pages.length),
    refetchInterval: (query) =>
      requestedAt !== null &&
      generation.isSuccess &&
      query.state.status !== 'error' &&
      needsNarration(query.state.data?.pages) &&
      (query.state.data?.checkedAt ?? requestedAt) - requestedAt < WAIT_MS
        ? POLL_MS
        : false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
  const missing = needsNarration(completion.data?.pages);
  const error = completion.error ?? (missing ? generation.error : null);
  const timedOut =
    missing && requestedAt !== null && (completion.data?.checkedAt ?? 0) - requestedAt >= WAIT_MS;
  const pending =
    completion.isFetching ||
    generation.isFetching ||
    (requestedAt !== null && missing && !error && !timedOut);

  const handleRequest = async () => {
    if (!id || !story || pending || requestLock.current) return;
    requestLock.current = true;
    try {
      // 응답 유실이나 재진입 시에도 기존 음성을 먼저 조회해 중복 생성을 막아요.
      const result = await completion.refetch({ cancelRefetch: false });
      if (!result.isSuccess || !needsNarration(result.data.pages) || !canGenerate) return;
      setRequested({ id, at: Date.now() });
      if (!generation.isSuccess) await generation.refetch({ cancelRefetch: false });
      await completion.refetch();
    } finally {
      requestLock.current = false;
    }
  };

  const checkedPages = completion.data?.pages ?? story?.pages ?? [];
  const diagnostics =
    __DEV__ && requestedAt !== null
      ? `동화 ${id} · 요청 ${generation.isFetching ? '전송 중' : generation.isSuccess ? '접수됨' : generation.isError ? '실패' : '대기'} · 음성 ${checkedPages.filter((page) => page.ttsUrl).length}/${checkedPages.length} · 문단 ID ${checkedPages.filter((page) => page.paragraphId).length}/${checkedPages.length}`
      : undefined;

  return {
    diagnostics,
    pages: completion.data?.pages ?? story?.pages,
    message: error
      ? error.message
      : timedOut
        ? checkedPages.every((page) => !page.paragraphId && !page.ttsUrl)
          ? '서버에서 음성 주소와 조회용 문단 번호를 받지 못했어요. 음성 연결 확인이 필요해요.'
          : '음성 요청은 접수됐지만 서버에서 재생할 파일을 아직 받지 못했어요.'
        : pending
          ? requestedAt === null
            ? '음성을 확인하고 있어요'
            : '요청한 음성 파일을 기다리고 있어요'
          : missing
            ? canGenerate
              ? '재생을 누르면 목소리를 만들어요'
              : '이 동화에는 아직 음성이 없어요. 지금은 글로 읽을 수 있어요.'
            : undefined,
    pending,
    onRequest: canGenerate && id && story ? handleRequest : undefined,
    onRetry: error || timedOut ? handleRequest : undefined,
  };
}

export type StoryNarration = ReturnType<typeof useStoryNarration>;
