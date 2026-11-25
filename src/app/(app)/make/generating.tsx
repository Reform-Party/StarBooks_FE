import { Redirect, router } from 'expo-router';
import { useEffect } from 'react';

import { missingSteps } from '@/features/make/constants/story-options';
import { useMakeStore } from '@/features/make/store/make-store';
import GeneratingScreen from '@/features/story/components/generating-screen';
import { useGenerationStore } from '@/features/story/store/generation-store';

export default function GeneratingRoute() {
  const selection = useMakeStore((s) => s.selection);
  const status = useGenerationStore((s) => s.status);
  const storyId = useGenerationStore((s) => s.storyId);
  const error = useGenerationStore((s) => s.error);
  const retryAction = useGenerationStore((s) => s.retryAction);
  const retry = useGenerationStore((s) => s.retry);
  const reset = useGenerationStore((s) => s.reset);
  const missing = missingSteps(selection).length > 0;

  // 준비 신호가 오면 읽기 화면으로 넘어가요. 스트림은 스토어에서 계속 이어져요.
  // 렌더 때 값이 아니라 지금 스토어 값을 봐요. 위 effect 가 같은 커밋에서 새로 시작했으면
  // 렌더 때 값은 이전 동화라서, 그대로 쓰면 이전 동화로 넘어가요.
  useEffect(() => {
    const { status: now, storyId: id } = useGenerationStore.getState();
    if ((now === 'ready' || now === 'done') && id) {
      router.replace({ pathname: '/story/[id]', params: { id } });
    }
  }, [status, storyId]);

  if (status === 'idle') return <Redirect href="/" />;
  if (missing) return <Redirect href="/make/confirm" />;

  return (
    <GeneratingScreen
      error={status === 'error' ? error : null}
      retryLabel={
        retryAction === 'bookshelf' ? '책장에서 확인' : storyId ? '결과 다시 확인' : '다시 시도'
      }
      onRetry={retryAction === 'bookshelf' ? () => router.dismissTo('/islands') : retry}
      onHome={() => {
        reset();
        router.dismissTo('/');
      }}
    />
  );
}
