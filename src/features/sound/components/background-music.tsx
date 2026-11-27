import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { useSettingsStore } from '@/features/settings/store/settings-store';
import { loadSounds, setBgmDucked, setBgmPlaying } from '@/features/sound/sound-players';
import { useBgmPauseStore } from '@/features/sound/store/bgm-pause-store';

function subscribeAppState(onChange: () => void) {
  const subscription = AppState.addEventListener('change', onChange);
  return () => subscription.remove();
}

const getAppActive = () => AppState.currentState === 'active';

// 기기에 저장된 설정을 불러오기 전에는 기본값(켜짐)으로 잠깐 울리지 않게 기다려요.
const subscribeHydration = (onChange: () => void) =>
  useSettingsStore.persist.onFinishHydration(onChange);
const getHydrated = () => useSettingsStore.persist.hasHydrated();

// 화면 없이 소리만 맡아요. 설정이 켜져 있고 앱이 앞에 있을 때만 배경음악을 틀어요.
// 동화를 읽는 동안에는 속삭이는 음량으로 줄여요.
export default function BackgroundMusic() {
  const enabled = useSettingsStore((s) => s.bgm);
  const paused = useBgmPauseStore((s) => s.holds > 0);
  const ducked = useBgmPauseStore((s) => s.ducks > 0);
  const appActive = useSyncExternalStore(subscribeAppState, getAppActive);
  const hydrated = useSyncExternalStore(subscribeHydration, getHydrated);

  useEffect(() => {
    loadSounds();
  }, []);

  // ducked 가 바뀔 때(동화 화면을 오갈 때)도 다시 맞춰서, 이어폰이 빠지는 등 네이티브가 멈춘 음악을 되살려요.
  useEffect(() => {
    setBgmPlaying(hydrated && enabled && appActive && !paused);
  }, [hydrated, enabled, appActive, paused, ducked]);

  useEffect(() => {
    setBgmDucked(ducked);
  }, [ducked]);

  return null;
}
