import { router } from 'expo-router';
import { useState } from 'react';

import { useAuthStore } from '@/features/auth/store/auth-store';
import OfflineShelfScreen from '@/features/offline/components/offline-shelf-screen';
import { useIsOnline } from '@/lib/network';

export default function OfflineShelfRoute() {
  const online = useIsOnline();
  const restore = useAuthStore((s) => s.restore);
  const [reconnecting, setReconnecting] = useState(false);

  // 로그인을 다시 확인해요. 성공하면 _layout 의 가드가 원래 앱으로 보내요.
  const handleReconnect = async () => {
    setReconnecting(true);
    try {
      await restore();
    } finally {
      setReconnecting(false);
    }
  };

  return (
    <OfflineShelfScreen
      onSelectStory={(story) =>
        router.push({ pathname: '/offline/story/[id]', params: { id: story.id } })
      }
      onReconnect={online ? () => void handleReconnect() : undefined}
      reconnecting={reconnecting}
    />
  );
}
