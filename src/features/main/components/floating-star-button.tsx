import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import JellyStar from '@/components/ui/jelly-star';
import PressableScale from '@/components/ui/pressable-scale';
import { STAR, type StarColor } from '@/constants/colors';
import { TYPE } from '@/constants/typography';

type Props = {
  label: string;
  tone: StarColor;
  // 가운데 별은 4.2s · 0.7s 늦게 · 반대로 기울며 떠요.
  reverse?: boolean;
  onPress: () => void;
};

const STAR_SIZE = 104;

// 메인 화면의 둥실 떠 있는 젤리 별 버튼 (3.8s · 위로 5pt · 1.5° 기울기)
export default function FloatingStarButton({ label, tone, reverse, onPress }: Props) {
  const t = useSharedValue(0);

  useEffect(() => {
    const half = (reverse ? 4200 : 3800) / 2;
    const loop = withRepeat(
      withTiming(1, { duration: half, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    t.set(reverse ? withDelay(700, loop) : loop);
  }, [reverse, t]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -(reverse ? 6 : 5) * t.get() },
      { rotate: `${(reverse ? -1.5 : 1.5) * t.get()}deg` },
    ],
  }));

  return (
    <PressableScale accessibilityLabel={label} onPress={onPress} style={styles.button}>
      <Animated.View style={floatStyle}>
        <JellyStar color={tone} size={STAR_SIZE} />
      </Animated.View>
      <Text
        style={[
          TYPE.heading,
          styles.label,
          { color: STAR[tone].rim, textShadowColor: `${STAR[tone].c500}88` },
        ]}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: { width: 120, alignItems: 'center', gap: 18 },
  label: { textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
});
