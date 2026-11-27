import { SCREEN } from '@/constants/layout';

// 관계도 게임 판 좌표 (디자인 c1 · c2 · c3). 화면 규격은 공용 SCREEN(874 × 402)을 따라요.
export type Area = { top: number; h: number };
export type Point = { x: number; y: number };

// 바구니 4개: x 59 → 815, 폭 180, 간격 12
export const BASKET_W = 180;
export const basketX = (i: number) => {
  'worklet';
  return SCREEN.safeX + i * 192;
};

// 단계별 바구니 영역 (1단계는 아래 트레이 때문에 낮고, 2 · 3단계는 그만큼 늘어나요)
export const CLASSIFY_AREA: Area = { top: 102, h: 170 };
export const LINK_AREA: Area = { top: 126, h: 248 };
export const TRAY = { left: SCREEN.safeX, top: 286, w: 756, h: 92 } as const;
export const TOAST_RECT = { left: 187, top: 280, w: 500, h: 96 } as const;

export const NODE_STAR = 36; // 바구니 안 별 크기
export const TRAY_STAR = 44;
export const HIT_R = 34; // 선 긋기 끝점 판정 반경
