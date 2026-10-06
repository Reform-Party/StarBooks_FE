import { StyleSheet } from 'react-native';

import { FONT, INK } from '@/features/commentary/constants/theme';

// ≥26pt Gaegu · 17–25pt ONE Mobile POP · <17pt Pretendard
export const TYPE = StyleSheet.create({
  title: { fontFamily: FONT.hand, fontSize: 34, lineHeight: 41, color: INK[1] },
  h2: { fontFamily: FONT.hand, fontSize: 26, lineHeight: 33, color: INK[1], textAlign: 'center' },
  bodyL: { fontFamily: FONT.pop, fontSize: 20, lineHeight: 31, color: INK[1] },
  cap: { fontFamily: FONT.sans, fontSize: 15, lineHeight: 21, color: INK[3] },
  label: { fontFamily: FONT.sansBold, fontSize: 13, lineHeight: 16, color: INK[1] },
});
