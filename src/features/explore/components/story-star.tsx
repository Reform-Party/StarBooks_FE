import { Pressable, StyleSheet, Text, View } from 'react-native';

import JellyStar from '@/components/ui/jelly-star';
import { STAR } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import type { StorySummary } from '@/features/explore/types/story';

type Props = {
  story: StorySummary;
  onPress: (story: StorySummary) => void;
};

export const STORY_STAR_SIZE = 76;

function splitTitle(title: string): string[] {
  const words = title.trim().split(/\s+/);

  if (words.length < 2) return [title];

  let bestIndex = 1;
  let bestDifference = Infinity;

  for (let index = 1; index < words.length; index += 1) {
    const left = words.slice(0, index).join(' ');
    const right = words.slice(index).join(' ');
    const difference = Math.abs(left.length - right.length);

    if (difference < bestDifference) {
      bestIndex = index;
      bestDifference = difference;
    }
  }

  return [words.slice(0, bestIndex).join(' '), words.slice(bestIndex).join(' ')];
}

export default function StoryStar({ story, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${story.title}, 동화 선택`}
      onPress={() => onPress(story)}
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
    >
      <View pointerEvents="none" accessible={false}>
        <JellyStar size={72.48} color="yellow" />
      </View>

      <View pointerEvents="none" style={styles.titleBox}>
        {splitTitle(story.title).map((line, index) => (
          <Text
            key={index}
            accessible={false}
            numberOfLines={1}
            ellipsizeMode="tail"
            maxFontSizeMultiplier={1.2}
            style={styles.title}
          >
            {line}
          </Text>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    width: STORY_STAR_SIZE,
    height: STORY_STAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
  titleBox: {
    position: 'absolute',
    top: 27,
    left: 7,
    right: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    width: '100%',
    fontFamily: FONT.sansBold,
    fontSize: 13,
    lineHeight: 15,
    includeFontPadding: false,
    textAlign: 'center',
    color: STAR.yellow.on,
  },
});
