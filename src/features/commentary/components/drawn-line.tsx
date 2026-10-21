import { useEffect } from 'react';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { G, Line } from 'react-native-svg';

import type { Point } from '@/features/commentary/constants/layout';
import { MOTION } from '@/features/commentary/constants/motion';

const AnimatedLine = Animated.createAnimatedComponent(Line);

type Props = { a: Point; b: Point; stroke: string; animate?: boolean };

// 관계선 하나 (은은한 빛 + 선). animate 면 정답 순간 a → b 로 0.25s 동안 그어져요.
export default function DrawnLine({ a, b, stroke, animate = false }: Props) {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const left = useSharedValue(animate ? len : 0);

  useEffect(() => {
    if (animate) left.set(withTiming(0, { duration: MOTION.lineDraw }));
  }, [animate, left]);

  const dash = useAnimatedProps(() => ({ strokeDashoffset: left.value }));

  return (
    <G strokeLinecap="round">
      <AnimatedLine
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={stroke}
        strokeWidth={10}
        opacity={0.18}
        strokeDasharray={[len, len]}
        animatedProps={dash}
      />
      <AnimatedLine
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={stroke}
        strokeWidth={3}
        strokeDasharray={[len, len]}
        animatedProps={dash}
      />
    </G>
  );
}
