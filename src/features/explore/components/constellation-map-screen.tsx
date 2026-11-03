import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import Stage from '@/components/ui/stage';
import { INK, STAR } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { SCREEN } from '@/constants/layout';
import StoryStar, { STORY_STAR_SIZE } from '@/features/explore/components/story-star';
import type { Island } from '@/features/explore/constants/islands';
import type { StorySummary } from '@/features/explore/types/story';

type Props = {
  island: Island;
  stories: StorySummary[];
  onBack: () => void;
  onSelectStory: (story: StorySummary) => void;
};

// 별 중심 좌표: 왼쪽부터 지그재그로 연결합니다.
const POSITIONS = [
  { x: 158, y: 225 },
  { x: 350, y: 315 },
  { x: 385, y: 195 },
  { x: 550, y: 295 },
  { x: 620, y: 165 },
  { x: 742, y: 305 },
] as const;

export default function ConstellationMapScreen({ island, stories, onBack, onSelectStory }: Props) {
  const visibleStories = stories.slice(0, POSITIONS.length);

  return (
    <Stage orientation="landscape">
      <View pointerEvents="none" style={styles.header}>
        <Image
          source={island.source}
          style={styles.islandImage}
          contentFit="contain"
          accessible={false}
        />
        <Text maxFontSizeMultiplier={1.2} style={styles.heading}>
          {island.name}
        </Text>
        <Text maxFontSizeMultiplier={1.2} style={styles.count}>
          내 동화 {stories.length}편
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="섬 선택으로 돌아가기"
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <Text style={styles.backText}>섬 선택</Text>
      </Pressable>

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width={SCREEN.width} height={SCREEN.height}>
          {visibleStories.slice(1).map((story, index) => {
            const start = POSITIONS[index];
            const end = POSITIONS[index + 1];

            return (
              <Line
                key={story.id}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={STAR.yellow.rim}
                strokeWidth={3}
                strokeOpacity={0.22}
                strokeLinecap="round"
              />
            );
          })}
        </Svg>
      </View>

      {visibleStories.map((story, index) => {
        const point = POSITIONS[index];

        return (
          <View
            key={story.id}
            style={[
              styles.starSlot,
              {
                left: point.x - STORY_STAR_SIZE / 2,
                top: point.y - STORY_STAR_SIZE / 2,
              },
            ]}
          >
            <StoryStar story={story} onPress={onSelectStory} />
          </View>
        );
      })}

      {stories.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>아직 이 섬에 동화가 없어요</Text>
        </View>
      ) : null}
    </Stage>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 6,
    left: 220,
    right: 220,
    alignItems: 'center',
  },
  islandImage: {
    width: 76,
    height: 58,
  },
  heading: {
    marginTop: -6,
    fontFamily: FONT.hand,
    fontSize: 26.5,
    lineHeight: 33,
    includeFontPadding: false,
    textAlign: 'center',
    color: STAR.yellow.rim,
  },
  count: {
    fontFamily: FONT.sansBold,
    fontSize: 12,
    lineHeight: 17,
    includeFontPadding: false,
    color: INK[3],
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: SCREEN.safeX,
    minWidth: 76,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  backText: {
    fontFamily: FONT.sans,
    fontSize: 14,
    color: INK[1],
  },
  pressed: {
    opacity: 0.7,
  },
  starSlot: {
    position: 'absolute',
  },
  empty: {
    position: 'absolute',
    top: 200,
    left: 100,
    right: 100,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FONT.sans,
    fontSize: 16,
    color: INK[2],
  },
});
