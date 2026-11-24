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
  const retry = useGenerationStore((s) => s.retry);
  const reset = useGenerationStore((s) => s.reset);
  const missing = missingSteps(selection).length > 0;

  // 생성 POST는 확인 화면의 명시적인 버튼에서만 시작해요. 재진입/Reload는 재전송하지 않아요.
  useEffect(() => {
    const { status: now, storyId: id } = useGenerationStore.getState();
    if ((now === 'ready' || now === 'done' || now === 'recovered') && id) {
      router.replace({ pathname: '/story/[id]', params: { id, from: 'generated' } });
    }
  }, [status, storyId]);

  if (missing) return <Redirect href="/make/confirm" />;

  return (
    <GeneratingScreen
      error={
        status === 'idle'
          ? '진행 중인 동화 번호를 확인할 수 없어요. 책장에서 생성 결과를 확인해 주세요.'
          : status === 'error'
            ? error
            : null
      }
      onRetry={retry}
      onHome={() => {
        reset();
        router.dismissTo('/');
      }}
    />
  );
}
