import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Platform } from 'react-native';

import { useSettingsStore } from '@/features/settings/store/settings-store';
import { APP_AUDIO_MODE } from '@/features/sound/audio-mode';

const CLICK_SOURCE = require('@/assets/sounds/button-click.m4a');
const BGM_SOURCE = require('@/assets/sounds/bgm.m4a');

// 동화를 읽는 동안 쓰는 속삭이는 음량이에요. (원래 음량의 8%)
const BGM_VOLUME = 1;
const BGM_DUCKED_VOLUME = 0.08;

// 앱이 켜져 있는 동안 계속 쓰는 플레이어라 화면마다 만들지 않고 하나씩만 둬요.
let click: AudioPlayer | null = null;
let bgm: AudioPlayer | null = null;
let bgmWanted = false;

// 첫 탭에서 파일을 읽느라 소리가 늦지 않게 앱을 켤 때 미리 불러요.
export function loadSounds() {
  if (!click) {
    if (Platform.OS !== 'web') setAudioModeAsync(APP_AUDIO_MODE).catch(() => undefined);
    const player = createAudioPlayer(CLICK_SOURCE);
    // iOS 는 끝난 자리에서 play() 하면 다시 울리지 않아요. 끝나자마자 처음으로 되감아 둬요.
    player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) player.seekTo(0).catch(() => undefined);
    });
    click = player;
  }
  if (!bgm) {
    bgm = createAudioPlayer(BGM_SOURCE);
    bgm.loop = true;
  }
}

// 버튼 효과음. 설정에서 꺼 두면 울리지 않아요.
export function playClick() {
  if (!useSettingsStore.getState().sfx) return;
  loadSounds();
  const player = click;
  if (!player) return;
  // 울리는 중에 또 누르면 되감은 뒤에 울려요. (seekTo 는 비동기라 play 가 먼저 처리되면 소리가 안 나요)
  if (player.playing) {
    player
      .seekTo(0)
      .then(() => player.play())
      .catch(() => undefined);
  } else {
    player.play();
  }
  // 웹은 사용자가 누르기 전에는 자동 재생을 막아요. 첫 탭에서 배경음악을 다시 틀어요.
  if (Platform.OS === 'web' && bgmWanted && bgm && !bgm.playing) bgm.play();
}

// 같은 값으로 다시 불러도 괜찮아요. 이어폰이 빠지는 등 네이티브가 멈춘 배경음악을 다시 틀 때도 써요.
export function setBgmPlaying(playing: boolean) {
  loadSounds();
  bgmWanted = playing;
  if (playing) bgm?.play();
  else bgm?.pause();
}

export function setBgmDucked(ducked: boolean) {
  loadSounds();
  if (bgm) bgm.volume = ducked ? BGM_DUCKED_VOLUME : BGM_VOLUME;
}
