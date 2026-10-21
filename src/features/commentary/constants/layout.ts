// iPhone 16 Pro 가로 874 × 402pt 기준 좌표. 화면은 Stage 가 비율대로 늘리거나 줄여요.
export const W = 874;
export const H = 402;
const SX = 59; // 좌우 safe area
export const SB = 21; // 홈 인디케이터

export type Area = { top: number; h: number };
export type Point = { x: number; y: number };

// 바구니 4개: x 59 → 815, 폭 180, 간격 12
export const BASKET_W = 180;
export const basketX = (i: number) => {
  'worklet';
  return SX + i * 192;
};

// 단계별 바구니 영역 (디자인 c1 / c2)
export const CLASSIFY_AREA: Area = { top: 102, h: 170 };
export const LINK_AREA: Area = { top: 126, h: 248 };
export const TRAY = { left: SX, top: 286, w: 756, h: 92 } as const;
export const TOAST_RECT = { left: 187, top: 280, w: 500, h: 96 } as const;
export const HOME_BTN = { left: 775, top: 12, size: 40 } as const;

export const NODE_STAR = 36; // 바구니 안 별 크기
export const TRAY_STAR = 44;
export const HIT_R = 34; // 선 긋기 끝점 판정 반경
