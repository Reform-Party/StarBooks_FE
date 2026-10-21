import { Easing } from 'react-native';

// 디자인 문서(06) 모션 값. 화면마다 같은 값을 쓰도록 여기서만 정해요.
export const MOTION = {
  // Spring: cubic-bezier(.34, 1.56, .64, 1)
  springEase: Easing.bezier(0.34, 1.56, 0.64, 1),
  spring: 200,
  modalPop: 300,
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
  pressScale: 0.94,
  pressOpacity: 0.88,
  spin: 1000,
  twinkle: 3000,
} as const;
