import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { MOTION } from '@/features/commentary/constants/motion';

type Props = { x: number; y: number; color: string; delay: number; still: boolean };

const R = 5;
const tw4 = (x: number, y: number, r: number) =>
  `${x},${y - r} ${x + r * 0.3},${y - r * 0.3} ${x + r},${y} ${x + r * 0.3},${y + r * 0.3} ${x},${y + r} ${x - r * 0.3},${y + r * 0.3} ${x - r},${y} ${x - r * 0.3},${y - r * 0.3}`;

// 반짝이는 네 갈래 별 (디자인 문서 06 Twinkle: 3s · opacity .3→.95 · scale .8→1.15)
// still(동작 줄이기)이면 멈춘 채로 그려요.
export default function Twinkle({ x, y, color, delay, still }: Props) {
  const v = useState(() => new Animated.Value(0.85))[0];
  useEffect(() => {
    if (still) {
      v.setValue(0.85);
      return undefined;
    }
    const half = MOTION.twinkle / 2;
    const ease = Easing.inOut(Easing.sin);
    v.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: half, easing: ease, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: half, easing: ease, useNativeDriver: true }),
      ]),
    );
    const t = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [v, still, delay]);
  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: x - R,
          top: y - R,
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.95] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.15] }) }],
        },
      ]}
    >
      <Svg width={R * 2} height={R * 2}>
        <Polygon points={tw4(R, R, R)} fill={color} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({ star: { position: 'absolute', width: R * 2, height: R * 2 } });
