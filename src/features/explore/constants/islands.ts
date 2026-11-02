import type { ImageSource } from 'expo-image';

export type Island = {
  id: 'fantasy' | 'medieval' | 'folktale';
  name: string;
  source: ImageSource;
  centerX: number;
  top: number;
  floatMs: number;
};

// SVG의 기존 캔버스 크기를 유지합니다.
// 섬 이름과 동화 편수는 FloatingIsland에서 표시합니다.
export const ISLAND_WIDTH = 170;
export const ISLAND_HEIGHT = 174;

export const ISLANDS: Island[] = [
  {
    id: 'fantasy',
    name: '판타지 섬',
    source: require('@/features/explore/assets/fantasy.svg'),
    centerX: 230,
    top: 184,
    floatMs: 4200,
  },
  {
    id: 'medieval',
    name: '중세 섬',
    source: require('@/features/explore/assets/medieval.svg'),
    centerX: 437,
    top: 72,
    floatMs: 5400,
  },
  {
    id: 'folktale',
    name: '전래 동화 섬',
    source: require('@/features/explore/assets/folktale.svg'),
    centerX: 645,
    top: 175,
    floatMs: 3600,
  },
];
