import { StyleSheet } from 'react-native';

import { FONT } from '@/constants/fonts';

// Figma design › 04 타이포그래피
// 26pt 이상 Gaegu · 17–25pt ONE Mobile POP · 17pt 미만 Pretendard
// 자간: Gaegu +1% · ONE Mobile POP −1% · Pretendard −1%
// includeFontPadding: 안드로이드가 글꼴 위아래에 넣는 여백을 빼서 iOS 와 세로 위치를 맞춰요.
const base = { includeFontPadding: false } as const;

export const TYPE = StyleSheet.create({
  display: { ...base, fontFamily: FONT.hand, fontSize: 52, lineHeight: 57, letterSpacing: 0.52 },
  title: { ...base, fontFamily: FONT.hand, fontSize: 34, lineHeight: 41, letterSpacing: 0.34 },
  heading: { ...base, fontFamily: FONT.hand, fontSize: 26, lineHeight: 33, letterSpacing: 0.26 },
  bodyL: { ...base, fontFamily: FONT.pop, fontSize: 20, lineHeight: 31, letterSpacing: -0.2 },
  body: { ...base, fontFamily: FONT.pop, fontSize: 18, lineHeight: 27, letterSpacing: -0.18 },
  button: { ...base, fontFamily: FONT.pop, fontSize: 19, lineHeight: 24, letterSpacing: -0.19 },
  caption: { ...base, fontFamily: FONT.sans, fontSize: 15, lineHeight: 21, letterSpacing: -0.15 },
  captionBold: {
    ...base,
    fontFamily: FONT.sansBold,
    fontSize: 15,
    lineHeight: 18,
    letterSpacing: -0.15,
  },
});
