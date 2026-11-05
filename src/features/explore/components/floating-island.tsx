import { Image } from 'expo-image';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { INK, STAR } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { ISLAND_HEIGHT, ISLAND_WIDTH, type Island } from '@/features/explore/constants/islands';

type Props = {
  island: Island;
  storyCount?: number;
  onPress?: (island: Island) => void;
};

const NAME_COLORS: Record<Island['id'], string> = {
  fantasy: '#99F6E4',
  medieval: STAR.purple.rim,
  folktale: STAR.yellow.rim,
};

export default function FloatingIsland({ island, storyCount, onPress }: Props) {
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withRepeat(
      withTiming(-6, {
        duration: island.floatMs / 2,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );

    return () => cancelAnimation(offset);
  }, [island.floatMs, offset]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  const label = storyCount == null ? island.name : `${island.name}, 동화 ${storyCount}편`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => onPress?.(island)}
      style={({ pressed }) => [
        styles.slot,
        { left: island.centerX - ISLAND_WIDTH / 2, top: island.top },
        pressed && styles.pressed,
      ]}
    >
      <Animated.View style={[styles.content, floatStyle]}>
        <Image
          source={island.source}
          style={styles.image}
          contentFit="contain"
          accessible={false}
        />
        <Text maxFontSizeMultiplier={1.2} style={[styles.name, { color: NAME_COLORS[island.id] }]}>
          {island.name}
        </Text>
        {storyCount != null ? (
          <Text maxFontSizeMultiplier={1.2} style={styles.count}>
            동화 {storyCount}편
          </Text>
        ) : null}
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
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.94 }, { translateY: 1 }],
  },
  content: {
    width: ISLAND_WIDTH,
    height: ISLAND_HEIGHT,
  },
  image: {
    width: ISLAND_WIDTH,
    height: ISLAND_HEIGHT,
  },
  name: {
    position: 'absolute',
    top: 128,
    left: 0,
    right: 0,
    fontFamily: FONT.hand,
    fontSize: 24,
    lineHeight: 28,
    includeFontPadding: false,
    textAlign: 'center',
    opacity: 0.88,
  },
  count: {
    position: 'absolute',
    top: 156,
    left: 0,
    right: 0,
    fontFamily: FONT.sansBold,
    fontSize: 12,
    lineHeight: 17,
    includeFontPadding: false,
    textAlign: 'center',
    color: INK[3],
    opacity: 0.88,
  },
});
