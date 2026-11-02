import type { FontSource } from 'expo-font';

// 커스텀 글꼴은 굵기마다 파일이 따로라서 fontWeight 대신 이름으로 굵기를 골라요.
// (안드로이드에서 fontWeight 를 같이 주면 기본 글꼴로 바뀌어요.)
export const FONT = {
  hand: 'Gaegu-Bold', // 26pt 이상 제목 · 별 이름
  pop: 'ONEMobilePOP', // 17–25pt 본문 · 버튼 · 선택지 (굵기 하나뿐)
  sans: 'Pretendard-Medium', // 17pt 미만 설명
  sansSemi: 'Pretendard-SemiBold',
  sansBold: 'Pretendard-Bold', // 칩 · 라벨 · 숫자
} as const;

// useFonts(APP_FONTS) 로 불러와요.
// 라이선스: Gaegu · Pretendard = SIL OFL 1.1 / ONE 모바일 POP = ㈜원스토어 (앱 탑재 가능, 파일 수정·재배포 금지)
export const APP_FONTS: Record<(typeof FONT)[keyof typeof FONT], FontSource> = {
  [FONT.hand]: require('@/assets/fonts/Gaegu-Bold.ttf'),
  [FONT.pop]: require('@/assets/fonts/ONE-Mobile-POP.ttf'),
  [FONT.sans]: require('@/assets/fonts/Pretendard-Medium.ttf'),
  [FONT.sansSemi]: require('@/assets/fonts/Pretendard-SemiBold.ttf'),
  [FONT.sansBold]: require('@/assets/fonts/Pretendard-Bold.ttf'),
};
