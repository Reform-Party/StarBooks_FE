import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Stage from '@/components/ui/stage';
import { INK, STAR } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { SCREEN } from '@/constants/layout';
import StorySelectModal from '@/features/explore/components/story-select-modal';
import ConstellationMapBody from '@/features/explore/components/constellation-map-body';
import StoryStar from '@/features/explore/components/story-star';
import type { Island } from '@/features/explore/constants/islands';
import type { ConstellationPagination } from '@/features/explore/hooks/use-constellation-pagination';
import type { StorySummary } from '@/features/explore/types/story';

type Props = {
  island: Island;
  stories: StorySummary[];
  onBack: () => void;
  onSelectStory: (story: StorySummary) => void;
  onCommentary?: (story: StorySummary) => void;
  pagination: ConstellationPagination;
};

export default function ConstellationMapScreen(props: Props) {
  return <ConstellationMapContent key={props.island.id} {...props} />;
}

function ConstellationMapContent({
  island,
  stories,
  onBack,
  onSelectStory,
  onCommentary,
  pagination,
}: Props) {
  const [selectedStory, setSelectedStory] = useState<StorySummary | null>(null);
  const isModalOpen = selectedStory !== null;
  const { totalElements } = pagination;

  return (
    <Stage orientation="landscape">
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents={isModalOpen ? 'none' : 'auto'}
        accessibilityElementsHidden={isModalOpen}
        importantForAccessibility={isModalOpen ? 'no-hide-descendants' : 'auto'}
      >
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
            내 동화 {totalElements}편
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="섬 선택으로 돌아가기"
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text maxFontSizeMultiplier={1.2} style={styles.backText}>
            섬 선택
          </Text>
        </Pressable>

        <ConstellationMapBody
          stories={stories}
          pagination={pagination}
          tone="yellow"
          blocked={isModalOpen}
          edgeHints
          emptyText="아직 이 섬에 동화가 없어요"
          pageHint="다른 쪽에도 내가 만든 동화가 있어요"
          renderStar={(story) => <StoryStar story={story} onPress={setSelectedStory} />}
        />
      </View>

      <StorySelectModal
        story={selectedStory}
        islandName={island.name}
        onClose={() => setSelectedStory(null)}
        onRead={(story) => {
          setSelectedStory(null);
          onSelectStory(story);
        }}
        onCommentary={
          onCommentary
            ? (story) => {
                setSelectedStory(null);
                onCommentary(story);
              }
            : undefined
        }
      />
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
});
