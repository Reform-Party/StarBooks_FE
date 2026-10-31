import { type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { GLASS, INK, STAR, type StarColor } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { RADIUS } from '@/constants/layout';

type Props = {
  label: string;
  // 없으면 유리 숫자 칩 (예: "1 / 2")
  tone?: StarColor;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
};

// Figma 칩 · 카드 · 슬롯: 교훈 · 주인공 · 배경 같은 색 칩, 1 / 2 같은 유리 칩
export default function Chip({ label, tone, size = 'md', style }: Props) {
  const star = tone ? STAR[tone] : null;
  return (
    <View
      style={[
        styles.chip,
        size === 'sm' ? styles.sm : styles.md,
        star ? { backgroundColor: `${star.c500}29`, borderColor: `${star.c300}66` } : styles.glass,
        style,
      ]}
    >
      <Text
        numberOfLines={1}
        style={[styles.label, size === 'sm' && styles.labelSm, { color: star ? star.rim : INK[1] }]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  md: { height: 28, paddingHorizontal: 12 },
  sm: { height: 20, paddingHorizontal: 8 },
  glass: { backgroundColor: GLASS.fill, borderColor: GLASS.line },
  label: {
    includeFontPadding: false,
    fontFamily: FONT.sansBold,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  labelSm: { fontSize: 12 },
});
