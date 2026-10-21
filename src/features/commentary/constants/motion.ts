import { Easing } from 'react-native';

import { DURATION } from '@/constants/motion';

// 관계도 게임 화면의 모션 값 (Figma 06 · 화면별 인터랙션 설명). 공용 값은 @/constants/motion 을 써요.
export const MOTION = {
  // Spring 곡선 cubic-bezier(.34, 1.56, .64, 1) — RN Animated 용 (공용 SPRING_EASING 은 Reanimated 용)
  springEase: Easing.bezier(0.34, 1.56, 0.64, 1),
  spring: DURATION.press,
  dissolve: 300,
  // 오답 배너가 떠 있는 시간
  toast: 1800,
  // 오답: 붉은 틴트 → 화면 흔들림(좌우 6pt) → 별이 목록으로 복귀
  tint: 150,
  shake: 300,
  shakePx: 6,
  back: 300,
  // 2단계 진입: 아래 목록이 내려가며 영역이 늘어나요
  trayHide: 350,
  lineDraw: 250,
  longPress: 750,
  liftScale: 1.1,
  spin: 1000,
} as const;
