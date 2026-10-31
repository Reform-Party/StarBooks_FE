import { Children, type ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { STAR, type StarColor, withAlpha } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { RADIUS } from '@/constants/layout';
import Text from '@/features/commentary/components/app-text';

type Props = {
  tone: StarColor;
  height?: number;
  font?: 'pop' | 'sans';
  fontSize?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  // 글자와 아이콘(젤리 별 · Icon)을 섞어 넣을 수 있어요
  children: ReactNode;
};

// 누르지 않는 작은 젤리 이름표 (바구니 이름 · 지금 단계 표시). 누르는 버튼은 공용 JellyButton 을 써요.
export default function JellyLabel({
  tone,
  height = 26,
  font = 'sans',
  fontSize = 14.5,
  accessibilityLabel,
  style,
  children,
}: Props) {
  const c = STAR[tone];
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.label,
        { height, boxShadow: `0px 6px 14px ${withAlpha(c.c500, 0.38)}` },
        style,
      ]}
    >
      <View style={styles.fill} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id={`jl-${tone}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={c.c300} />
              <Stop offset="1" stopColor={c.c500} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#jl-${tone})`} />
        </Svg>
        <View style={styles.hiTop} />
        <View style={[styles.hiBottom, { backgroundColor: c.deep }]} />
      </View>
      {Children.map(children, (ch) =>
        typeof ch === 'string' || typeof ch === 'number' ? (
          <Text style={[font === 'pop' ? styles.pop : styles.sans, { color: c.on, fontSize }]}>
            {ch}
          </Text>
        ) : (
          <View>{ch}</View>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 11,
    borderRadius: RADIUS.pill,
  },
  fill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  hiTop: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 1,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  hiBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3 },
  pop: { includeFontPadding: false, fontFamily: FONT.pop },
  sans: { includeFontPadding: false, fontFamily: FONT.sansBold, letterSpacing: -0.3 },
});
