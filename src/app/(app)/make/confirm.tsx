import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

import MakeConfirmScreen from '@/features/make/components/make-confirm-screen';

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
        pushed.current = true;
        router.push('/make/generating');
      }}
    />
  );
}
