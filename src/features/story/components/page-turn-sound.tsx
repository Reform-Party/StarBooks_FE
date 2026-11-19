import { useAudioPlayer } from 'expo-audio';
import { useEffect } from 'react';

// Mounted only during the page animation. Unmounting releases the player before narration starts.
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
        // Sound is optional. Reading continues if playback is unavailable.
      }
    };
    const subscription = player.addListener('playbackStatusUpdate', handleLoaded);
    handleLoaded();
    return () => subscription.remove();
  }, [player]);

  return null;
}
