import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import type { Category } from '@/features/commentary/api/types';
import { type Area, BASKET_W, basketX } from '@/features/commentary/constants/layout';
import { GLASS } from '@/features/commentary/constants/theme';
import { useReduceMotion } from '@/features/commentary/hooks/use-motion';
import { defaultSpot, spotToPoint } from '@/features/commentary/utils/game-logic';

type Props = { categories: Category[]; area: Area };

const DOT = 30;
const PER_BASKET = 2;

// 게임 · 관계도를 불러오는 동안 보여주는 관계도 모양 스켈레톤 (디자인 3 · 별자리 완성)
export default function GraphSkeleton({ categories, area }: Props) {
  const reduce = useReduceMotion();
  const v = useState(() => new Animated.Value(0.4))[0];
  useEffect(() => {
    if (reduce) return undefined;
    const ease = Easing.inOut(Easing.quad);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 700, easing: ease, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.4, duration: 700, easing: ease, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, reduce]);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { opacity: v }]}
      pointerEvents="none"
      accessible
      accessibilityLabel="관계도를 불러오고 있어요"
      accessibilityRole="progressbar"
    >
      {categories.map((cat, i) => (
        <View
          key={cat}
          style={[
            styles.basket,
            { left: basketX(i), top: area.top, width: BASKET_W, height: area.h },
          ]}
        >
          {Array.from({ length: PER_BASKET }, (_, k) => {
            const p = spotToPoint(defaultSpot(i, k, PER_BASKET), area);
            return (
              <View
                key={k}
                style={[
                  styles.dot,
                  { left: p.x - basketX(i) - DOT / 2, top: p.y - area.top - DOT / 2 },
                ]}
              />
            );
          })}
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  basket: {
    position: 'absolute',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GLASS.line,
    backgroundColor: GLASS.fill,
  },
  dot: {
    position: 'absolute',
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: GLASS.fill2,
  },
});
