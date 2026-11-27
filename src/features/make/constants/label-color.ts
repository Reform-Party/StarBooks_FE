import { STAR, type StarColor } from '@/constants/colors';

// 고른 별 이름 색 (Figma: 노랑 300 · 민트 rim · 보라 rim)
export const labelColor = (tone: StarColor) =>
  tone === 'yellow' ? STAR.yellow.c300 : STAR[tone].rim;
