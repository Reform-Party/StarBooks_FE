import { Image } from 'expo-image';
import { useCallback, useMemo, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeInLeft, FadeInRight } from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';

import GlassIconButton from '@/components/ui/glass-icon-button';
import Stage from '@/components/ui/stage';
import { INK, STAR } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { SCREEN } from '@/constants/layout';
import type { SharedStorySummary } from '@/features/explore/api/shared-stories-api';
import StoryStar, { STORY_STAR_SIZE } from '@/features/explore/components/story-star';
import { STORY_POSITIONS as POSITIONS } from '@/features/explore/constants/constellation';
import { ISLANDS } from '@/features/explore/constants/islands';

type Props = {
  stories: SharedStorySummary[];
  onHome: () => void;
  onSelectStory: (story: SharedStorySummary) => void;
  busy?: boolean;
  pagination: {
    page: number;
    totalPages: number;
    totalElements: number;
    hasPrevious: boolean;
    hasNext: boolean;
    onPageChange: (page: number) => void;
  };
};

const ENTER_FROM_RIGHT = FadeInRight.duration(350).easing(Easing.out(Easing.cubic));
const ENTER_FROM_LEFT = FadeInLeft.duration(350).easing(Easing.out(Easing.cubic));

export default function SharedConstellationMapScreen({
  stories,
  onHome,
  onSelectStory,
  pagination,
  busy = false,
}: Props) {
  const [direction, setDirection] = useState<-1 | 0 | 1>(0);

  const {
    page: currentPage,
    totalPages: pageCount,
    totalElements,
    hasPrevious,
    hasNext,
    onPageChange,
  } = pagination;

  // 서버가 요청한 개수보다 많이 보내도 좌표가 있는 만큼만 표시해요.
  const visibleStories = stories.slice(0, POSITIONS.length);

  const movePage = useCallback(
    (step: -1 | 1) => {
      if (busy) return;
      if (step === -1 && !hasPrevious) return;
      if (step === 1 && !hasNext) return;

      const nextPage = currentPage + step;
      if (nextPage < 0 || nextPage >= pageCount) return;

      setDirection(step);
      onPageChange(nextPage);
    },
    [currentPage, pageCount, hasPrevious, hasNext, onPageChange, busy],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          !busy &&
          gesture.numberActiveTouches === 1 &&
          Math.abs(gesture.dx) > 12 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
        onPanResponderRelease: (_, gesture) => {
          if (Math.abs(gesture.dx) < 50 || Math.abs(gesture.dx) <= Math.abs(gesture.dy) * 1.5) {
            return;
          }

          movePage(gesture.dx < 0 ? 1 : -1);
        },
        onPanResponderTerminationRequest: () => true,
      }),
    [movePage, busy],
  );

  return (
    <Stage orientation="landscape">
      <View style={StyleSheet.absoluteFill}>
        <View pointerEvents="none" style={styles.header}>
          <Image
            source={ISLANDS[0].source}
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

        <View
          pointerEvents="box-none"
          style={StyleSheet.absoluteFill}
          {...panResponder.panHandlers}
        >
          <Animated.View
            key={currentPage}
            pointerEvents="box-none"
            style={StyleSheet.absoluteFill}
            entering={
              direction === 0 ? undefined : direction === 1 ? ENTER_FROM_RIGHT : ENTER_FROM_LEFT
            }
          >
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
                      stroke={STAR.mint.rim}
                      strokeWidth={3}
                      strokeOpacity={0.22}
                      strokeLinecap="round"
                    />
                  );
                })}
              </Svg>
            </View>

            {/* 빈 하늘에서 시작한 스와이프를 받도록 네이티브 뷰를 유지해요. */}
            <View collapsable={false} style={styles.swipeArea} />

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
                  <StoryStar
                    story={story}
                    authorName={story.authorName}
                    color="mint"
                    onPress={() => onSelectStory(story)}
                  />
                </View>
              );
            })}
          </Animated.View>
        </View>

        {hasPrevious ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="이전 쪽"
            disabled={busy}
            accessibilityState={{ disabled: busy }}
            onPress={() => movePage(-1)}
            style={({ pressed }) => [
              styles.pageButton,
              styles.previousButton,
              pressed && styles.pressed,
            ]}
          >
            <Text maxFontSizeMultiplier={1.2} style={styles.arrowText}>
              ‹
            </Text>
          </Pressable>
        ) : null}

        {hasNext ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="다음 쪽"
            disabled={busy}
            accessibilityState={{ disabled: busy }}
            onPress={() => movePage(1)}
            style={({ pressed }) => [
              styles.pageButton,
              styles.nextButton,
              pressed && styles.pressed,
            ]}
          >
            <Text maxFontSizeMultiplier={1.2} style={styles.arrowText}>
              ›
            </Text>
          </Pressable>
        ) : null}

        {pageCount > 0 ? (
          <View style={styles.footer}>
            <View
              accessible
              accessibilityLabel={`${pageCount}쪽 중 ${currentPage + 1}쪽`}
              style={styles.pageIndicator}
            >
              {pageCount <= 5
                ? Array.from({ length: pageCount }, (_, index) => (
                    <View
                      key={index}
                      style={[styles.pageDot, index === currentPage && styles.activePageDot]}
                    />
                  ))
                : null}
              <Text maxFontSizeMultiplier={1.2} style={styles.pageText}>
                {currentPage + 1} / {pageCount}
              </Text>
            </View>

            {pageCount > 1 ? (
              <Text maxFontSizeMultiplier={1.2} style={styles.pageHint}>
                옆으로 넘기면 전에 만든 동화가 있어요
              </Text>
            ) : null}
          </View>
        ) : null}

        {stories.length === 0 ? (
          <View style={styles.empty}>
            <Text maxFontSizeMultiplier={1.2} style={styles.emptyText}>
              아직 공개된 동화가 없어요
            </Text>
          </View>
        ) : null}
      </View>
    </Stage>
  );
}

const styles = StyleSheet.create({
  swipeArea: {
    position: 'absolute',
    top: 160,
    left: 0,
    right: 0,
    bottom: 50,
  },
  pageButton: {
    position: 'absolute',
    top: 120,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previousButton: {
    left: SCREEN.safeX,
  },
  nextButton: {
    right: SCREEN.safeX,
  },
  arrowText: {
    fontFamily: FONT.sans,
    fontSize: 26,
    lineHeight: 30,
    includeFontPadding: false,
    color: INK[1],
  },
  footer: {
    position: 'absolute',
    bottom: SCREEN.safeBottom,
    left: 100,
    right: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  activePageDot: {
    width: 18,
    backgroundColor: STAR.mint.c300,
  },
  pageText: {
    marginLeft: 4,
    fontFamily: FONT.sansBold,
    fontSize: 13,
    color: INK[1],
  },
  pageHint: {
    fontFamily: FONT.sans,
    fontSize: 11,
    color: INK[3],
  },
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
  homeButton: { position: 'absolute', top: SCREEN.topBarY, left: SCREEN.homeButtonX },
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
