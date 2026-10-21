import { type ReactNode, useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import { MOTION } from '@/features/commentary/constants/motion';

type Props = { children: ReactNode };

// 단계가 바뀔 때 디졸브 0.3s ease-out (디자인: 다음 단계로 · 해설 다음 · 메인으로)
export default function FadeIn({ children }: Props) {
  const v = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: MOTION.dissolve,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [v]);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: v }]} pointerEvents="box-none">
      {children}
    </Animated.View>
  );
}
