// Figma design › 02 화면 규격 · 06 간격 · 모서리 · 모션
// 모든 화면은 iPhone 16 Pro 가로(874 × 402pt) 기준으로 그려요.
export const SCREEN = {
  width: 874,
  height: 402,
  safeX: 59, // 좌우 safe area (다이내믹 아일랜드 쪽과 대칭)
  safeBottom: 21, // 홈 인디케이터
  topBarY: 12, // 유리 아이콘 버튼 40pt 가 놓이는 줄
  homeButtonX: 775, // 메인 버튼은 오른쪽 끝
} as const;

// 로그인 · 회원가입 · 아이 정보만 세로(402 × 874pt)로 그려요.
export const PORTRAIT_SCREEN = {
  width: 402,
  height: 874,
  safeX: 20,
  topBarY: 62, // 상태 표시줄 · 다이내믹 아일랜드 아래
} as const;

export const MIN_TOUCH = 44; // Apple HIG

export const RADIUS = { chip: 10, card: 14, basket: 18, panel: 22, pill: 999 } as const;

// 같은 무리 안은 gap 으로만 띄워요.
export const SPACE = { 1: 4, 2: 6, 3: 8, 4: 12, 5: 16, 6: 24, 7: 32 } as const;
