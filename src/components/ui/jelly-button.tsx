import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import PressableScale from '@/components/ui/pressable-scale';
import { GLASS, INK, STAR, type StarColor } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { RADIUS } from '@/constants/layout';
import { TYPE } from '@/constants/typography';

export type JellyButtonTone = StarColor | 'glass' | 'plain';

type Props = {
  label: string;
  tone?: JellyButtonTone;
  // 라벨 앞에 붙는 아이콘 (Icon · JellyStar)
  icon?: ReactNode;
  // true 면 아이콘을 라벨 뒤에 붙여요 (예: 다음 →)
  iconAfter?: boolean;
  width?: number;
  height?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

// 알약 모양 버튼 (Figma Button/Yellow · Mint · Purple · Pink · Glass · Plain)
// 젤리 색은 300 → 500 세로 그라데이션, glass 는 흰색 8% + 선 22%, plain 은 글씨만 있어요.
export default function JellyButton({
  label,
  tone = 'yellow',
  icon,
  iconAfter = false,
  width,
  height = 44,
  disabled,
  accessibilityLabel,
  onPress,
  style,
}: Props) {
  const star = tone === 'glass' || tone === 'plain' ? null : STAR[tone];
  const labelColor = star ? star.on : tone === 'plain' ? INK[3] : INK[1];

  return (
    <PressableScale
      width={width}
      height={height}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      style={[styles.button, { width, height }, tone === 'glass' && styles.glass, style]}
    >
      {star ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id={`jelly-${tone}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={star.c300} />
                <Stop offset="1" stopColor={star.c500} />
              </LinearGradient>
            </Defs>
            <Rect
              width="100%"
              height="100%"
              rx={height / 2}
              ry={height / 2}
              fill={`url(#jelly-${tone})`}
            />
          </Svg>
        </View>
      ) : null}
      {iconAfter ? null : icon}
      <Text
        numberOfLines={1}
        style={[tone === 'plain' ? styles.plainLabel : TYPE.button, { color: labelColor }]}
      >
        {label}
      </Text>
      {iconAfter ? icon : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    borderRadius: RADIUS.pill,
  },
  glass: { backgroundColor: GLASS.fill, borderWidth: 1, borderColor: GLASS.line },
  plainLabel: { fontFamily: FONT.sans, fontSize: 15.5, letterSpacing: -0.15 },
});
