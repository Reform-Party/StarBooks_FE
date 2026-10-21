import { Children, type ReactNode, useState } from 'react';
import {
  Animated,
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import Text from '@/features/commentary/components/app-text';
import { MOTION } from '@/features/commentary/constants/motion';
import {
  FONT,
  GLASS,
  INK,
  RADIUS,
  STAR,
  type StarColor,
  withAlpha,
} from '@/features/commentary/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  tone?: StarColor | 'glass';
  height?: number;
  // 글자 길이를 모르는 버튼(서버가 만든 선택지)은 최소 높이만 정하고 늘어나게 해요
  minHeight?: number;
  numberOfLines?: number;
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
  minHeight,
  numberOfLines,
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
  const press = useState(() => new Animated.Value(0))[0];
  const c = tone === 'glass' ? null : STAR[tone];
  const labelColor = c ? c.on : INK[1];
  const base: StyleProp<ViewStyle> = [
    styles.btn,
    minHeight ? { minHeight } : { height },
    { width, minWidth, opacity: disabled ? 0.4 : 1 },
    c ? { boxShadow: `0px 6px 14px ${withAlpha(c.c500, 0.38)}` } : styles.glass,
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
            numberOfLines={numberOfLines}
            style={[
              font === 'pop' ? styles.pop : styles.sans,
              numberOfLines ? styles.wrap : null,
              { color: labelColor, fontSize },
            ]}
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

  // 눌림: 0.94배 · 1pt 아래 · 투명도 88% · 스프링 0.2s (디자인 2 · 관계 퀴즈)
  const animate = (to: number) =>
    Animated.timing(press, {
      toValue: to,
      duration: MOTION.spring,
      easing: MOTION.springEase,
      useNativeDriver: true,
    }).start();
  const pressed = {
    opacity: press.interpolate({ inputRange: [0, 1], outputRange: [1, MOTION.pressOpacity] }),
    transform: [
      { scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, MOTION.pressScale] }) },
      { translateY: press.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) },
    ],
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => animate(1)}
      onPressOut={() => animate(0)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      style={[base, pressed, style]}
    >
      {content}
    </AnimatedPressable>
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
  wrap: { flexShrink: 1, textAlign: 'center' },
});
