import { useAudioPlayer } from 'expo-audio';
import { useEffect } from 'react';

// 페이지 전환 중에만 마운트하고, 읽어주기 시작 전에 플레이어를 해제해요.
export default function PageTurnSound() {
  const player = useAudioPlayer(require('@/features/story/assets/page-turn.wav'));

  useEffect(() => {
    let started = false;
    const handleLoaded = () => {
      if (started || !player.isLoaded) return;
      started = true;
      try {
        player.play();
      } catch {
        // 효과음을 재생하지 못해도 동화 읽기는 계속해요.
      }
    };
    const subscription = player.addListener('playbackStatusUpdate', handleLoaded);
    handleLoaded();
    return () => subscription.remove();
  }, [player]);

  return null;
}
