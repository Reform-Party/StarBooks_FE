import { StyleSheet } from 'react-native';

import { FONT, INK } from '@/features/commentary/constants/theme';

// 고정 좌표 화면이라 기기 글자 크기를 이 배수까지만 따라가요 (그 이상은 토스트 · 버튼 · 트레이가 깨져요)
export const MAX_FONT_SCALE = 1.2;

// ≥26pt Gaegu · 17–25pt ONE Mobile POP · <17pt Pretendard (Pretendard 자간 −1%, 버튼 · 카드 −2%)
export const TYPE = StyleSheet.create({
  title: { fontFamily: FONT.hand, fontSize: 34, lineHeight: 41, color: INK[1] },
  h2: { fontFamily: FONT.hand, fontSize: 26, lineHeight: 33, color: INK[1], textAlign: 'center' },
  bodyL: { fontFamily: FONT.pop, fontSize: 20, lineHeight: 31, color: INK[1] },
  cap: { fontFamily: FONT.sans, fontSize: 15, lineHeight: 21, letterSpacing: -0.15, color: INK[3] },
  label: {
    fontFamily: FONT.sansBold,
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: -0.13,
    color: INK[1],
  },
});
