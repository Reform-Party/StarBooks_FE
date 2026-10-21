import { useState } from 'react';
import {
  type AccessibilityActionEvent,
  Animated,
  Easing,
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import Text from '@/features/commentary/components/app-text';
import JellyStar from '@/components/ui/jelly-star';
import { NODE_STAR } from '@/features/commentary/constants/board';
import { MOTION } from '@/features/commentary/constants/motion';
import { WRONG_TINT } from '@/features/commentary/constants/palette';
import { FONT } from '@/constants/fonts';
import { INK, STAR, type StarColor } from '@/constants/colors';
import { usePop, usePulse } from '@/features/commentary/hooks/use-motion';

type Props = {
  color: StarColor;
  name: string;
  cx: number;
  cy: number;
  size?: number;
  selected?: boolean;
  pop?: boolean;
  // 0 → 1 → 0 으로 움직이면 별이 잠깐 붉어져요 (오답)
  tint?: Animated.Value;
  // 3단계: 누르면 1초 회전 (0.5초 가속 → 0.5초 감속)
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  // 스크린 리더의 "활성화"(iOS 두 번 탭 · TalkBack 두 번 탭) — 양쪽 플랫폼에서 동작해요
  onActivate?: () => void;
};

const ACTIONS = [{ name: 'activate' }];

// 이야기 별 = 젤리 별 + 아래 이름. (cx, cy) 는 별의 한가운데. 긴 이름은 두 줄로 넘어가요.
export default function StarNode({
  color,
  name,
  cx,
  cy,
  size = NODE_STAR,
  selected = false,
  pop = false,
  tint,
  onPress,
  style,
  accessibilityLabel,
  onActivate,
}: Props) {
  const popStyle = usePop();
  const pulse = usePulse(selected);
  const spin = useState(() => new Animated.Value(0))[0];
  const ringColor = STAR[color].c300;
  const ring = {
    borderColor: ringColor,
    width: size + 16,
    height: size + 16,
    borderRadius: (size + 16) / 2,
  };

  const handlePress = () => {
    spin.setValue(0);
    Animated.timing(spin, {
      toValue: 1,
      duration: MOTION.spin,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
    onPress?.();
  };
  const handleAction = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName !== 'activate') return;
    if (onActivate) onActivate();
    else if (onPress) handlePress();
  };

  const star = (
    <View style={{ width: size, height: size }}>
      {selected ? (
        <>
          <View style={[styles.ring, ring]} />
          <Animated.View style={[styles.ring, ring, pulse]} />
        </>
      ) : null}
      <Animated.View
        style={
          onPress
            ? {
                transform: [
                  {
                    rotate: spin.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              }
            : undefined
        }
      >
        <JellyStar color={color} size={size} glow />
        {tint ? (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: tint }]}>
            <JellyStar size={size} tint={WRONG_TINT} />
          </Animated.View>
        ) : null}
      </Animated.View>
    </View>
  );

  return (
    <Animated.View
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? name}
      accessibilityState={{ selected }}
      accessibilityActions={onActivate || onPress ? ACTIONS : undefined}
      onAccessibilityAction={handleAction}
      style={[styles.node, { left: cx - 50, top: cy - size / 2 }, pop && popStyle, style]}
    >
      {onPress ? (
        <Pressable onPress={handlePress} hitSlop={8} accessible={false}>
          {star}
        </Pressable>
      ) : (
        star
      )}
      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  node: { position: 'absolute', width: 100, alignItems: 'center', gap: 2 },
  name: {
    maxWidth: 130,
    fontFamily: FONT.sansBold,
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: -0.26,
    color: INK[1],
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  ring: {
    position: 'absolute',
    left: -8,
    top: -8,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
});
