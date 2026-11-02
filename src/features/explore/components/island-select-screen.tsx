import { StyleSheet, Text, View } from 'react-native';

import Stage from '@/components/ui/stage';
import { INK, STAR } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { TYPE } from '@/constants/typography';
import FloatingIsland from '@/features/explore/components/floating-island';
import { ISLANDS, type Island } from '@/features/explore/constants/islands';

type Props = {
  onSelectIsland?: (island: Island) => void;
};

const DOT_COUNT = 18;

const START = { x: 295, y: 218 };
const CONTROL = { x: 437, y: 50 };
const END = { x: 605, y: 200 };

const DOTS = Array.from({ length: DOT_COUNT }, (_, i) => {
  const t = i / (DOT_COUNT - 1);
  const u = 1 - t;

  return {
    x: u * u * START.x + 2 * u * t * CONTROL.x + t * t * END.x,
    y: u * u * START.y + 2 * u * t * CONTROL.y + t * t * END.y,
  };
});

export default function IslandSelectScreen({ onSelectIsland }: Props) {
  return (
    <Stage orientation="landscape">
      {DOTS.map((dot, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={[styles.dot, { left: dot.x - 1.5, top: dot.y - 1.5 }]}
        />
      ))}

      <View pointerEvents="none" style={styles.titleBox}>
        <Text style={[TYPE.heading, styles.title]}>테마를 선택해주세요!</Text>
        <Text style={styles.subtitle}>내가 만든 동화가 섬마다 모여 있어요</Text>
      </View>

      {ISLANDS.map((island) => (
        <FloatingIsland key={island.id} island={island} onPress={onSelectIsland} />
      ))}
    </Stage>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(210, 200, 255, 0.5)',
  },
  titleBox: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  title: {
    color: STAR.yellow.rim,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: FONT.sans,
    fontSize: 13,
    lineHeight: 18,
    includeFontPadding: false,
    color: INK[2],
  },
});
