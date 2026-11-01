import type { ImageSource } from 'expo-image';

// 피그마 화면 규격: iPhone 16 Pro 가로
export const STAGE_WIDTH = 874;
export const STAGE_HEIGHT = 402;

// 공통 디자인 토큰 PR(#6)이 합쳐지면 그쪽 값으로 교체합니다.
export const STAGE_COLORS = {
  background: '#0D1024',
  title: '#FDE68A',
  subtitle: '#CBD5E1',
  dot: 'rgba(210, 200, 255, 0.5)',
};

export type Island = {
  id: 'fantasy' | 'medieval' | 'folktale';
  name: string;
  source: ImageSource;
  centerX: number; // 섬 가운데 가로 위치
  top: number; // 이미지 위쪽 세로 위치
  floatMs: number; // 둥실 한 번 오가는 시간
};

// 섬 이미지(170 x 174)에는 이름과 동화 편수 글씨가 들어 있습니다.
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
