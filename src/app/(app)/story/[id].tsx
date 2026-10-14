import { router, useLocalSearchParams } from 'expo-router';

import StoryFrameScreen from '@/features/story/components/story-frame-screen';
import { useStory } from '@/features/story/hooks/use-story';
import { useGenerationStore } from '@/features/story/store/generation-store';

export default function StoryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const gen = useGenerationStore();
  // 지금 만들고 있는 동화면 스트림에서, 이미 저장된 동화면 API 에서 읽어요.
  const isLive = gen.storyId === id;
  const saved = useStory(isLive ? null : id);

  if (isLive) {
    const failed = gen.status === 'error';
    return (
      <StoryFrameScreen
        title={gen.meta?.title ?? null}
        pages={gen.pages}
        totalPages={gen.totalPages}
        streaming={!failed && gen.status !== 'done'}
        error={failed ? gen.error : null}
        onRetry={
          failed
            ? () => {
                gen.retry();
                router.replace('/make/generating');
              }
            : undefined
        }
        onHome={() => router.dismissTo('/')}
      />
    );
  }

  return (
    <StoryFrameScreen
      title={saved.isError ? '동화를 열지 못했어요' : (saved.data?.title ?? null)}
      pages={saved.data?.pages ?? []}
      totalPages={saved.data?.pages.length ?? 0}
      streaming={false}
      error={saved.error?.message ?? null}
      onHome={() => router.dismissTo('/')}
    />
  );
}
