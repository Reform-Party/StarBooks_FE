import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import AlertModal from '@/components/ui/alert-modal';

import { useMakeStore } from '@/features/make/store/make-store';
import { isSameSelection, useGenerationStore } from '@/features/story/store/generation-store';
import { buildGenerateRequest } from '@/features/story/utils/build-generate-request';
import MakeConfirmScreen from '@/features/make/components/make-confirm-screen';

export default function MakeConfirmRoute() {
  // 빠르게 두 번 눌러 만드는 중 화면이 두 번 쌓이지 않게, 이 화면에 돌아올 때까지 한 번만 받아요.
  const pushed = useRef(false);
  const [showBusy, setShowBusy] = useState(false);
  useFocusEffect(
    useCallback(() => {
      pushed.current = false;
    }, []),
  );

  return (
    <>
      <MakeConfirmScreen
        onMake={() => {
          if (pushed.current) return;
          const request = buildGenerateRequest(useMakeStore.getState().selection);
          const running = useGenerationStore.getState();
          if (
            (running.status === 'connecting' || running.status === 'ready') &&
            running.request &&
            !isSameSelection(running.request, request)
          ) {
            setShowBusy(true);
            return;
          }
          void running.start(request);
          pushed.current = true;
          router.push('/make/generating');
        }}
      />
      <AlertModal
        visible={showBusy}
        title="동화를 만들고 있어요"
        message="먼저 요청한 동화가 완성된 뒤 새로운 동화를 만들어 주세요."
        onAction={() => setShowBusy(false)}
      />
    </>
  );
}
