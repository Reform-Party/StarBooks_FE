import type { StarColor } from '@/constants/colors';

export type ConstellationStar = { label: string; value: string; tone: StarColor };

// 완성 별자리의 별 위치 (중심 기준, Figma 화면 좌표에서 계산) · z 는 돌 때의 앞뒤 깊이
export const CONSTELLATION_LAYOUT = [
  { x: -145, y: -32, z: 40 },
  { x: 145, y: -24, z: -40 },
  { x: 0, y: 56, z: 80 },
] as const;
