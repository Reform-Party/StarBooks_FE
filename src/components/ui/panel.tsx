import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { GLASS, PANEL } from '@/constants/colors';
import { RADIUS } from '@/constants/layout';

type Props = {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

// 남색 유리 패널 (Figma Panel · 모달 · 설정 카드 · 단어장)
export default function Panel({ style, children }: Props) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: PANEL.fill,
    borderWidth: 1,
    borderColor: GLASS.line,
    borderRadius: RADIUS.panel,
  },
});
