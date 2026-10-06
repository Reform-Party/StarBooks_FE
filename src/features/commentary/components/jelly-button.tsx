import { Children, type ReactNode } from 'react';
import { Pressable, type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import {
  FONT,
  GLASS,
  INK,
  RADIUS,
  STAR,
  type StarColor,
} from '@/features/commentary/constants/theme';

type Props = {
  tone?: StarColor | 'glass';
  height?: number;
  width?: number;
  minWidth?: number;
  font?: 'pop' | 'sans';
  fontSize?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

// 젤리 버튼 (Primary 44pt pill). onPress 가 없으면 눌리지 않는 라벨(바구니 이름표 · 단계 표시)이에요.
export default function JellyButton({
  tone = 'yellow',
  height = 44,
  width,
  minWidth,
  font = 'pop',
  fontSize = 19,
  disabled,
  accessibilityLabel,
  onPress,
  style,
  children,
}: Props) {
  const c = tone === 'glass' ? null : STAR[tone];
  const labelColor = c ? c.on : INK[1];
  const base: StyleProp<ViewStyle> = [
    styles.btn,
    { height, width, minWidth, opacity: disabled ? 0.4 : 1 },
    c
      ? {
          shadowColor: c.c500,
          shadowOpacity: 0.38,
          shadowRadius: 7,
          shadowOffset: { width: 0, height: 6 },
        }
      : styles.glass,
  ];

  const content = (
    <>
      {c ? (
        <View style={styles.fill} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id={`jb-${tone}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={c.c300} />
                <Stop offset="1" stopColor={c.c500} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill={`url(#jb-${tone})`} />
          </Svg>
          <View style={[styles.hiTop, tone === 'purple' && styles.hiTopPurple]} />
          <View style={[styles.hiBottom, { backgroundColor: c.dark }]} />
        </View>
      ) : null}
      {Children.map(children, (ch) =>
        typeof ch === 'string' || typeof ch === 'number' ? (
          <Text
            style={[font === 'pop' ? styles.pop : styles.sans, { color: labelColor, fontSize }]}
          >
            {ch}
          </Text>
        ) : (
          <View>{ch}</View>
        ),
      )}
    </>
  );

  if (!onPress) {
    return (
      <View style={[base, style]} accessibilityLabel={accessibilityLabel}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, pressed && styles.pressed, style]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
    borderRadius: RADIUS.pill,
  },
  glass: { backgroundColor: GLASS.fill, borderWidth: 1, borderColor: GLASS.line },
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
  hiTopPurple: { backgroundColor: 'rgba(255,255,255,0.45)' },
  hiBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3 },
  pop: { fontFamily: FONT.pop, letterSpacing: 0 },
  sans: { fontFamily: FONT.sansBold, letterSpacing: -0.3 },
  pressed: { transform: [{ scale: 0.94 }, { translateY: 1 }] },
});
