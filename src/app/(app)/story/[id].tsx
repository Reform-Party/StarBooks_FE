import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { isValidStoryId } from '@/features/story/api/story-api';
import StoryFrameScreen from '@/features/story/components/story-frame-screen';
import { useStory } from '@/features/story/hooks/use-story';
import { useGenerationStore } from '@/features/story/store/generation-store';

export default function StoryRoute() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = isValidStoryId(rawId) ? rawId : null;

  // 만드는 중에 열린 화면은 나갈 때까지 live 로 둬요. ("다시 만들기" 로 storyId 가 비는 순간
  // 저장된 동화 분기로 바뀌어 방금 실패한 id 를 요청하지 않게)
  const [openedLive] = useState(() => id != null && useGenerationStore.getState().storyId === id);
  // 이 동화를 만들고 있을 때만 생성 상태를 구독해요. (저장된 동화를 볼 때 글자마다 리렌더되지 않게)
  const live = useGenerationStore(
    useShallow((s) =>
      openedLive || (id != null && s.storyId === id)
        ? {
            status: s.status,
            meta: s.meta,
            pages: s.pages,
            totalPages: s.totalPages,
            error: s.error,
          }
        : null,
    ),
  );
  const retry = useGenerationStore((s) => s.retry);
  const reset = useGenerationStore((s) => s.reset);
  const saved = useStory(live || !id ? null : id);

  if (live) {
    const failed = live.status === 'error';
    return (
      <StoryFrameScreen
        title={live.meta?.title ?? null}
        pages={live.pages}
        totalPages={live.totalPages}
        streaming={!failed && live.status !== 'done'}
        error={failed ? live.error : null}
        onRetry={
          failed
            ? () => {
                retry();
                router.replace('/make/generating');
              }
            : undefined
        }
        // 메인으로 나가면 만들던 스트림도 끊어요. (만드는 중 화면의 "메인으로" 와 같게)
        onHome={() => {
          reset();
          router.dismissTo('/');
        }}
      />
    );
  }

  const failed = !id || saved.isError;
  return (
    <StoryFrameScreen
      title={failed ? '동화를 열지 못했어요' : (saved.data?.title ?? null)}
      pages={saved.data?.pages ?? []}
      totalPages={saved.data?.pages.length ?? 0}
      streaming={false}
      error={id ? (saved.error?.message ?? null) : '동화를 찾을 수 없어요'}
      onHome={() => router.dismissTo('/')}
    />
  );
}
