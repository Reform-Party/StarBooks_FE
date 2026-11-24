import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

import MakeConfirmScreen from '@/features/make/components/make-confirm-screen';
import { useMakeStore } from '@/features/make/store/make-store';
import { missingSteps } from '@/features/make/constants/story-options';
import { useGenerationStore } from '@/features/story/store/generation-store';
import { buildGenerateRequest } from '@/features/story/utils/build-generate-request';

export default function MakeConfirmRoute() {
  // 빠르게 두 번 눌러 만드는 중 화면이 두 번 쌓이지 않게, 이 화면에 돌아올 때까지 한 번만 받아요.
  const pushed = useRef(false);
  useFocusEffect(
    useCallback(() => {
      pushed.current = false;
    }, []),
  );

  return (
    <MakeConfirmScreen
      onMake={() => {
        if (pushed.current) return;
        const selection = useMakeStore.getState().selection;
        if (missingSteps(selection).length) return;
        pushed.current = true;
        void useGenerationStore.getState().start(buildGenerateRequest(selection));
        router.push('/make/generating');
      }}
    />
  );
}
