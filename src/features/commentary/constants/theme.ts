// 별나라 책방 디자인 토큰 (디자인 시스템 페이지에서 그대로 옮김)
// 커스텀 글꼴은 굵기마다 파일이 따로라서 fontWeight 를 쓰지 않고 이름으로 굵기를 골라요
// (안드로이드에서 fontWeight 를 같이 주면 기본 글꼴로 바뀌는 문제가 있어요).
export const FONT = {
  hand: 'Gaegu-Bold', // 26pt 이상 제목 · 별 이름
  pop: 'ONEMobilePOP', // 17–25pt 본문 · 버튼 · 선택지 (굵기 하나뿐)
  sans: 'Pretendard-Medium', // 17pt 미만 설명
  sansSemi: 'Pretendard-SemiBold', // 칩 · 보조 라벨
  sansBold: 'Pretendard-Bold', // 카드 이름 · 작은 버튼
} as const;

export const SKY = { top: '#171B38', mid: '#0D1024', deep: '#070914' } as const;

export const INK = { 1: '#F1F5F9', 2: '#CBD5E1', 3: '#94A3B8' } as const;

export const GLASS = {
  fill: 'rgba(255,255,255,0.08)',
  fill2: 'rgba(255,255,255,0.14)',
  line: 'rgba(255,255,255,0.22)',
  panel: 'rgba(22,26,60,0.84)', // + blur 16 (iOS 는 expo-blur)
  // 안드로이드는 화면 구조상 blur 를 못 줘서 글자가 잘 보이게 조금 더 진하게
  panelSolid: 'rgba(22,26,60,0.92)',
  scrim: 'rgba(5,6,18,0.62)',
} as const;

// 연결선 · 은하수 (디자인 문서 03 Milky way)
export const MILKY_WAY = ['#38BDF8', '#818CF8', '#C084FC', '#F472B6', '#FDE047'] as const;

export const PAPER = { fill: '#FBF7EE', edge: '#E9E1CF', ink: '#241F52', ink2: '#6B6790' } as const;

type StarTone = {
  g0: string;
  g1: string;
  g2: string;
  g3: string;
  c300: string;
  c500: string;
  rim: string;
  ink: string;
  on: string;
  glow: string;
  dark: string;
};

export type StarColor = 'yellow' | 'mint' | 'purple' | 'pink';

// 젤리 별 4색 — yellow: 교훈 · 주요 버튼 / mint: 등장인물 · 완료 / purple: 장소 / pink: 사건 · 오답 안내
export const STAR: Record<StarColor, StarTone> = {
  yellow: {
    g0: '#FFFBEB',
    g1: '#FDE047',
    g2: '#F59E0B',
    g3: '#D97706',
    c300: '#FDE047',
    c500: '#F59E0B',
    rim: '#FDE68A',
    ink: '#FDE68A',
    on: '#3B2200',
    glow: 'rgba(251,191,36,0.55)',
    dark: 'rgba(217,119,6,0.85)',
  },
  mint: {
    g0: '#E6FFFA',
    g1: '#5CE1E6',
    g2: '#14B8A6',
    g3: '#0F766E',
    c300: '#5CE1E6',
    c500: '#14B8A6',
    rim: '#A7F3D0',
    ink: '#99F6E4',
    on: '#032B28',
    glow: 'rgba(92,225,230,0.55)',
    dark: 'rgba(15,118,110,0.85)',
  },
  purple: {
    g0: '#FAF5FF',
    g1: '#C084FC',
    g2: '#8B5CF6',
    g3: '#581C87',
    c300: '#C084FC',
    c500: '#8B5CF6',
    rim: '#E9D5FF',
    ink: '#E9D5FF',
    on: '#2A0B45',
    glow: 'rgba(168,85,247,0.55)',
    dark: 'rgba(88,28,135,0.85)',
  },
  pink: {
    g0: '#FDF2F8',
    g1: '#F9A8D4',
    g2: '#F472B6',
    g3: '#BE185D',
    c300: '#F9A8D4',
    c500: '#F472B6',
    rim: '#FBCFE8',
    ink: '#FBCFE8',
    on: '#4A0626',
    glow: 'rgba(244,114,182,0.55)',
    dark: 'rgba(219,39,119,0.8)',
  },
};

export const RADIUS = { s: 10, m: 14, basket: 18, l: 22, pill: 999 } as const;

// 간격 스케일 (디자인 문서 06): 4 · 6 · 8 · 12 · 16 · 24 · 32
export const SPACE = { xxs: 4, xs: 6, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;

// '#RRGGBB' → 'rgba(r,g,b,a)'
export const withAlpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
