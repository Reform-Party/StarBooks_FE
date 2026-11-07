import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import GlassIconButton from '@/components/ui/glass-icon-button';
import Stage from '@/components/ui/stage';
import { INK, STAR } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { SCREEN } from '@/constants/layout';
import type { SharedStorySummary } from '@/features/explore/api/shared-stories-api';
import ConstellationMapBody from '@/features/explore/components/constellation-map-body';
import StoryStar from '@/features/explore/components/story-star';
import type { ConstellationPagination } from '@/features/explore/hooks/use-constellation-pagination';

// 동화 여행 헤더는 기존 판타지 섬 이미지를 재사용합니다.
const SHARED_STORIES_HEADER_IMAGE = require('@/features/explore/assets/fantasy.svg');

type Props = {
  stories: SharedStorySummary[];
  onHome: () => void;
  onSelectStory: (story: SharedStorySummary) => void;
  busy?: boolean;
  pagination: ConstellationPagination;
};

export default function SharedConstellationMapScreen({
  stories,
  onHome,
  onSelectStory,
  pagination,
  busy = false,
}: Props) {
  const { totalElements } = pagination;

  return (
    <Stage orientation="landscape">
      <View style={StyleSheet.absoluteFill}>
        <View pointerEvents="none" style={styles.header}>
          <Image
            source={SHARED_STORIES_HEADER_IMAGE}
            style={styles.islandImage}
            contentFit="contain"
            accessible={false}
          />
          <Text maxFontSizeMultiplier={1.2} style={styles.heading}>
            동화 여행
          </Text>
          <Text maxFontSizeMultiplier={1.2} style={styles.count}>
            친구들이 만든 동화 {totalElements}편
          </Text>
        </View>

        <GlassIconButton icon="home" label="메인으로" onPress={onHome} style={styles.homeButton} />

        <ConstellationMapBody
          stories={stories}
          pagination={pagination}
          tone="mint"
          busy={busy}
          maxPageDots={5}
          emptyText="아직 공개된 동화가 없어요"
          pageHint="옆으로 넘기면 전에 만든 동화가 있어요"
          renderStar={(story) => (
            <StoryStar
              story={story}
              authorName={story.authorName}
              color="mint"
              onPress={() => onSelectStory(story)}
            />
          )}
        />
      </View>
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
    color: STAR.mint.rim,
  },
  count: {
    fontFamily: FONT.sansBold,
    fontSize: 12,
    lineHeight: 17,
    includeFontPadding: false,
    color: INK[3],
  },
  homeButton: {
    position: 'absolute',
    top: SCREEN.topBarY,
    left: SCREEN.homeButtonX,
  },
});
