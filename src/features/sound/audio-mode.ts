import type { AudioMode } from 'expo-audio';

// 앱 전체가 쓰는 오디오 모드. 배경음악 · 효과음 · 낭독 · 녹음이 모두 이 값으로 맞춰요.
// iOS 는 setAudioModeAsync 에 빠진 항목을 기본값으로 되돌려서, 부르는 곳마다 같은 값을 다 넘겨야 해요.
// - 무음 스위치를 켜 둬도 들려요. (낭독을 무음 모드에서도 들어야 해서 앱 전체를 맞춰요)
// - 다른 앱 소리를 끊지 않고 섞어요. 안드로이드에서 버튼을 누를 때마다 다른 앱 음악이 멈추지 않아요.
export const APP_AUDIO_MODE: Partial<AudioMode> = {
  playsInSilentMode: true,
  interruptionMode: 'mixWithOthers',
  shouldPlayInBackground: false,
};
