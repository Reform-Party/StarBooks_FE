import { Easing } from 'react-native-reanimated';

// Figma design › 06 간격 · 모서리 · 모션
// Spring: cubic-bezier(.34, 1.56, .64, 1) · 200ms — 살짝 튀었다가 제자리로 돌아와요.
export const SPRING_EASING = Easing.bezier(0.34, 1.56, 0.64, 1);

export const DURATION = {
  press: 200,
  toggle: 250, // 효과음 · 배경음악 켜고 끄기
  menu: 200, // 목록 펼침 · 모달 닫힘
  modal: 300, // 스크림 + 모달 팝
} as const;

export const PRESS_SCALE = 0.92;

// 반짝임: 3s · opacity .3 → .95 · scale .8 → 1.15
export const TWINKLE = { duration: 3000, opacity: [0.3, 0.95], scale: [0.8, 1.15] } as const;
