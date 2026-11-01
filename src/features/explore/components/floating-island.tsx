import { Image } from 'expo-image';
import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ISLAND_HEIGHT, ISLAND_WIDTH, type Island } from '@/features/explore/constants/islands';

type Props = {
  island: Island;
  onPress?: (island: Island) => void;
};

export default function FloatingIsland({ island, onPress }: Props) {
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withRepeat(
      withTiming(-6, { duration: island.floatMs / 2, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [island.floatMs, offset]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={island.name}
      onPress={() => onPress?.(island)}
      style={({ pressed }) => [
        styles.slot,
        { left: island.centerX - ISLAND_WIDTH / 2, top: island.top },
        pressed && styles.pressed,
      ]}
    >
      <Animated.View style={floatStyle}>
        <Image source={island.source} style={styles.image} contentFit="contain" />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    width: ISLAND_WIDTH,
    height: ISLAND_HEIGHT,
  },
  // 누르는 동안: 0.94배, 1pt 아래, 투명도 88%
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.94 }, { translateY: 1 }],
  },
  image: {
    width: ISLAND_WIDTH,
    height: ISLAND_HEIGHT,
  },
});
