// 별나라 책방 컬러 시스템 (Figma design › 03 컬러 시스템)
// 앱은 밤하늘 한 가지 테마만 써요. 라이트 / 다크 모드로 색이 바뀌지 않아요.

// 모든 화면 배경: radial-gradient(50% 20%) top → mid → deep
export const SKY = { top: '#171B38', mid: '#0D1024', deep: '#070914' } as const;

// 본문 · 보조 문구 · 설명
export const INK = { 1: '#F1F5F9', 2: '#CBD5E1', 3: '#94A3B8' } as const;

// 아이콘 버튼 · 보조 버튼 · 입력칸
export const GLASS = { fill: 'rgba(255,255,255,0.08)', line: 'rgba(255,255,255,0.22)' } as const;

// 모달 · 설정 카드. RN 에는 backdrop blur 가 없어 화면 시안처럼 .94 로 칠해요.
// solid 는 아래 버튼이 비치면 안 되는 펼친 목록용이에요.
export const PANEL = {
  fill: 'rgba(22,26,60,0.94)',
  solid: '#161A3C',
  scrim: 'rgba(5,6,18,0.94)',
} as const;

// 책 속지 · 이야기 카드
export const PAPER = { fill: '#FBF7EE', edge: '#E9E1CF', ink: '#241F52' } as const;

export type StarColor = 'yellow' | 'mint' | 'purple' | 'pink';

type StarTone = {
  hi: string; // 광택
  c300: string; // 그라데이션 시작
  c500: string; // 그라데이션 끝
  deep: string; // 가장 어두운 가장자리
  rim: string; // 별 테두리 · 강조 글씨
  on: string; // 이 색 위에 올리는 글씨 · 아이콘
};

// 젤리 별 4색 — yellow: 교훈 · 주요 버튼 / mint: 주인공 · 완료 / purple: 배경 · 장소 / pink: 사건 · 오답 안내
export const STAR: Record<StarColor, StarTone> = {
  yellow: {
    hi: '#FFFBEB',
    c300: '#FDE047',
    c500: '#F59E0B',
    deep: '#D97706',
    rim: '#FDE68A',
    on: '#3B2200',
  },
  mint: {
    hi: '#E6FFFA',
    c300: '#5CE1E6',
    c500: '#14B8A6',
    deep: '#0F766E',
    rim: '#A7F3D0',
    on: '#032B28',
  },
  purple: {
    hi: '#FAF5FF',
    c300: '#C084FC',
    c500: '#8B5CF6',
    deep: '#581C87',
    rim: '#E9D5FF',
    on: '#2A0B45',
  },
  pink: {
    hi: '#FDF2F8',
    c300: '#F9A8D4',
    c500: '#F472B6',
    deep: '#BE185D',
    rim: '#FBCFE8',
    on: '#4A0626',
  },
};

// '#RRGGBB' → 'rgba(r,g,b,a)' (별 빛 · 그림자처럼 토큰 색을 투명하게 쓸 때)
export const withAlpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
