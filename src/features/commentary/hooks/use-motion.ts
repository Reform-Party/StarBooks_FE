import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

// "동작 줄이기"가 켜져 있으면 반복 움직임을 모두 멈춰요 (디자인: Reduced motion)
function useReduceMotion() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (alive) setOn(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setOn);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return on;
}

// 둥실둥실 (float-slow 3.8s −5pt 1.5° / float-alt 4.2s −6pt −1.5°, 0.7s 늦게)
export function useFloat(variant: 'slow' | 'alt' = 'slow') {
  const reduce = useReduceMotion();
  const v = useState(() => new Animated.Value(0))[0];
  const alt = variant === 'alt';
  useEffect(() => {
    if (reduce) {
      v.setValue(0);
      return undefined;
    }
    const half = (alt ? 4200 : 3800) / 2;
    const ease = Easing.inOut(Easing.sin);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: half, easing: ease, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: half, easing: ease, useNativeDriver: true }),
      ]),
    );
    const t = setTimeout(() => loop.start(), alt ? 700 : 0);
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [reduce, alt, v]);
  return {
    transform: [
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, alt ? -6 : -5] }) },
      {
        rotate: v.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', alt ? '-1.5deg' : '1.5deg'],
        }),
      },
    ],
  };
}

// 틀렸을 때 도리도리 (wobble .5s × 3 → 아이가 기다리지 않게 .3s × 3)
export function wobble(value: Animated.Value, onEnd?: () => void) {
  const step = (to: number) =>
    Animated.timing(value, { toValue: to, duration: 75, useNativeDriver: true });
  Animated.sequence([step(-1), step(1), step(-1), step(1), step(-1), step(1), step(0)]).start(() =>
    onEnd?.(),
  );
}

// 선택된 별 둘레에서 퍼지는 링 (pulseRing)
export function usePulse(active: boolean) {
  const reduce = useReduceMotion();
  const v = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    if (!active || reduce) {
      v.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.timing(v, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [active, reduce, v]);
  return {
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.4] }) }],
  };
}

// 바구니에 쏙 들어갈 때 튀어오르기
export function usePop() {
  const v = useState(() => new Animated.Value(0.4))[0];
  useEffect(() => {
    Animated.spring(v, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }).start();
  }, [v]);
  return { transform: [{ scale: v }] };
}
