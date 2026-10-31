import { Redirect, router } from 'expo-router';
import { useEffect } from 'react';

import { missingSteps } from '@/features/make/constants/story-options';
import { useMakeStore } from '@/features/make/store/make-store';
import GeneratingScreen from '@/features/story/components/generating-screen';
import { isSameSelection, useGenerationStore } from '@/features/story/store/generation-store';
import { buildGenerateRequest } from '@/features/story/utils/build-generate-request';

export default function GeneratingRoute() {
  const selection = useMakeStore((s) => s.selection);
  const status = useGenerationStore((s) => s.status);
  const storyId = useGenerationStore((s) => s.storyId);
  const error = useGenerationStore((s) => s.error);
  const start = useGenerationStore((s) => s.start);
  const retry = useGenerationStore((s) => s.retry);
  const reset = useGenerationStore((s) => s.reset);
  const missing = missingSteps(selection).length > 0;

  // 들어오면 생성을 요청해요. 같은 선택으로 만들고 있으면("다시 만들기" 등) 그대로 잇고,
  // 선택이 바뀌었거나 이미 다 만든 뒤면 새로 시작해요.
  useEffect(() => {
    if (missing) return;
    const request = buildGenerateRequest(selection);
    const { status: current, request: running } = useGenerationStore.getState();
    const inFlight = current !== 'idle' && current !== 'done';
    if (inFlight && running && isSameSelection(running, request)) return;
    void start(request);
  }, [missing, selection, start]);

  // 준비 신호가 오면 읽기 화면으로 넘어가요. 스트림은 스토어에서 계속 이어져요.
  useEffect(() => {
    if ((status === 'ready' || status === 'done') && storyId) {
      router.replace({ pathname: '/story/[id]', params: { id: storyId } });
    }
  }, [status, storyId]);

  if (missing) return <Redirect href="/make/confirm" />;

  return (
    <GeneratingScreen
      error={status === 'error' ? error : null}
      onRetry={retry}
      onHome={() => {
        reset();
        router.dismissTo('/');
      }}
    />
  );
}
