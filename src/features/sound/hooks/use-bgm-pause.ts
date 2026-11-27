import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';

import { useBgmPauseStore } from '@/features/sound/store/bgm-pause-store';

// 목소리 녹음처럼 배경음악이 섞이면 안 되는 컴포넌트가 떠 있는 동안 멈춰요.
export function useBgmPause() {
  useEffect(() => useBgmPauseStore.getState().hold(), []);
}

// 동화 읽기 화면처럼 화면이 보이는 동안만 배경음악을 속삭이듯 줄여요. 다른 화면으로 넘어가면 원래대로 돌아와요.
export function useBgmDuckWhileFocused() {
  useFocusEffect(useCallback(() => useBgmPauseStore.getState().duck(), []));
}
