import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { STAR } from '@/constants/colors';
import { FONT } from '@/constants/fonts';

export const APP_NAME = '별나라 책방';

const SPIN_MS = 12000;

type Props = {
  size?: number;
};

// "✦ 별나라 책방 ✦" — Gaegu 노란 제목 + 왼쪽 노랑 · 오른쪽 민트 반짝이가 12s 에 한 바퀴 돌아요.
export default function BrandTitle({ size = 52 }: Props) {
  const turn = useSharedValue(0);

  useEffect(() => {
    turn.set(withRepeat(withTiming(1, { duration: SPIN_MS, easing: Easing.linear }), -1));
  }, [turn]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.get() * 360}deg` }],
  }));

  const sparkle = { fontSize: size * 0.5, lineHeight: size * 0.6 };

  return (
    <View accessible accessibilityRole="header" accessibilityLabel={APP_NAME} style={styles.row}>
      <Animated.Text style={[styles.sparkle, sparkle, { color: STAR.yellow.c300 }, spinStyle]}>
        ✦
      </Animated.Text>
      <Text style={[styles.name, { fontSize: size, lineHeight: size * 1.15 }]}>{APP_NAME}</Text>
      <Animated.Text style={[styles.sparkle, sparkle, { color: STAR.mint.c300 }, spinStyle]}>
        ✦
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: {
    includeFontPadding: false,
    fontFamily: FONT.hand,
    letterSpacing: 0.5,
    color: STAR.yellow.c300,
    textShadowColor: `${STAR.yellow.c300}66`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  // Gaegu 에는 ✦ 글자가 없어서 기본 글꼴로 그려요.
  sparkle: {
    includeFontPadding: false,
    textShadowColor: 'rgba(255,255,255,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});
