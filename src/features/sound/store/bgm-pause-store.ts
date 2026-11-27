import { create } from 'zustand';

type BgmPauseState = {
  // 배경음악을 잠시 멈춰 달라는 화면 수. 0 이면 설정대로 다시 틀어요.
  holds: number;
  // 배경음악을 속삭이듯 작게 줄여 달라는 화면 수. 0 이면 원래 음량이에요.
  ducks: number;
  hold: () => () => void;
  duck: () => () => void;
};

type Counter = 'holds' | 'ducks';

// 한 번만 되돌리는 정리 함수를 돌려줘요. (같은 정리가 두 번 불려도 숫자가 어긋나지 않아요)
function claim(set: (fn: (s: BgmPauseState) => Partial<BgmPauseState>) => void, key: Counter) {
  set((s) => ({ [key]: s[key] + 1 }));
  let released = false;
  return () => {
    if (released) return;
    released = true;
    set((s) => ({ [key]: s[key] - 1 }));
  };
}

export const useBgmPauseStore = create<BgmPauseState>()((set) => ({
  holds: 0,
  ducks: 0,
  hold: () => claim(set, 'holds'),
  duck: () => claim(set, 'ducks'),
}));
