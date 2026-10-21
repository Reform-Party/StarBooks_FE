import { Children, type ReactNode } from 'react';
import { type StyleProp, StyleSheet, type TextStyle, View, type ViewStyle } from 'react-native';

import Text from '@/features/commentary/components/app-text';
import { FONT } from '@/constants/fonts';
import { GLASS, INK, STAR, type StarColor } from '@/constants/colors';
import { RADIUS } from '@/constants/layout';

const TONES: Record<StarColor | 'plain', { bg: string; line: string; fg: string }> = {
  plain: { bg: GLASS.fill, line: GLASS.line, fg: INK[1] },
  yellow: { bg: 'rgba(253,224,71,0.16)', line: 'rgba(253,230,138,0.55)', fg: STAR.yellow.rim },
  mint: { bg: 'rgba(92,225,230,0.14)', line: 'rgba(167,243,208,0.5)', fg: STAR.mint.rim },
  purple: { bg: 'rgba(192,132,252,0.16)', line: 'rgba(233,213,255,0.5)', fg: STAR.purple.rim },
  pink: { bg: 'rgba(244,114,182,0.16)', line: 'rgba(251,207,232,0.5)', fg: STAR.pink.rim },
};

type Props = {
  tone?: StarColor | 'plain';
  height?: number;
  fontSize?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

// 단계 표시 칩 (끝난 단계 = 민트 ✓, 남은 단계 = 유리)
export default function StepChip({
  tone = 'plain',
  height = 32,
  fontSize = 15,
  children,
  style,
  textStyle,
}: Props) {
  const t = TONES[tone];
  return (
    <View
      style={[
        styles.chip,
        {
          height,
          paddingHorizontal: height < 26 ? 8 : 13,
          backgroundColor: t.bg,
          borderColor: t.line,
        },
        style,
      ]}
    >
      {Children.map(children, (ch) =>
        typeof ch === 'string' || typeof ch === 'number' ? (
          <Text style={[styles.text, { fontSize, color: t.fg }, textStyle]}>{ch}</Text>
        ) : (
          ch
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  text: { fontFamily: FONT.sansSemi },
});
