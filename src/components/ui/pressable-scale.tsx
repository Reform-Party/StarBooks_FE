import type { ReactNode } from 'react';
import {
  type GestureResponderEvent,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { MIN_TOUCH } from '@/constants/layout';
import { DURATION, PRESS_SCALE, SPRING_EASING } from '@/constants/motion';
import { playClick } from '@/features/sound/sound-players';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style' | 'children'> & {
  // 누를 자리를 44pt 로 맞추기 위해 실제 크기를 알려줘요. (더 작으면 hitSlop 으로 넓혀요)
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

// 누르면 .92 로 작아졌다가 놓으면 스프링으로 돌아와요. (Press: active scale .92 · 200ms spring)
// 눌렀을 때 버튼 효과음도 내요.
export default function PressableScale({
  width,
  height,
  style,
  children,
  disabled,
  onPress,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const pressed = useSharedValue(0);
  // 비활성 흐림도 animated style 안에서 줘야, 애니메이션이 끝난 뒤 남는 opacity 에 덮이지 않아요.
  const dim = disabled ? 0.4 : 1;
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: dim * (1 - pressed.get() * 0.15),
    transform: [{ scale: 1 - pressed.get() * (1 - PRESS_SCALE) }],
  }));

  const handlePressIn = (e: GestureResponderEvent) => {
    pressed.set(withTiming(1, { duration: DURATION.press, easing: SPRING_EASING }));
    onPressIn?.(e);
  };
  const handlePressOut = (e: GestureResponderEvent) => {
    pressed.set(withTiming(0, { duration: DURATION.press, easing: SPRING_EASING }));
    onPressOut?.(e);
  };

  // 버튼 효과음은 설정에서 꺼 두면 울리지 않아요.
  // onPress 뒤에 울려서, 효과음 토글은 켤 때 소리가 나고 끌 때는 조용해요.
  const handlePress = (e: GestureResponderEvent) => {
    onPress?.(e);
    playClick();
  };

  const slopX = width != null ? Math.max(0, (MIN_TOUCH - width) / 2) : 0;
  const slopY = height != null ? Math.max(0, (MIN_TOUCH - height) / 2) : 0;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={{ left: slopX, right: slopX, top: slopY, bottom: slopY }}
      onPress={onPress ? handlePress : undefined}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
