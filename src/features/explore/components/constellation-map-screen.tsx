import { STORY_POSITIONS as POSITIONS } from '@/features/explore/constants/constellation';
import { Image } from 'expo-image';
import { useCallback, useMemo, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeInLeft, FadeInRight } from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';

import Stage from '@/components/ui/stage';
import { INK, STAR } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { SCREEN } from '@/constants/layout';
import ConstellationEdgeHints from '@/features/explore/components/constellation-edge-hints';
import StoryStar, { STORY_STAR_SIZE } from '@/features/explore/components/story-star';
import type { Island } from '@/features/explore/constants/islands';
import type { StorySummary } from '@/features/explore/types/story';

type Props = {
  island: Island;
  stories: StorySummary[];
  onBack: () => void;
  onSelectStory: (story: StorySummary) => void;
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

export default function ConstellationMapScreen(props: Props) {
  return <ConstellationMapContent key={props.island.id} {...props} />;
}

function ConstellationMapContent({ island, stories, onBack, onSelectStory, pagination }: Props) {
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
  const lastPoint = POSITIONS[visibleStories.length - 1];

  const movePage = useCallback(
    (step: -1 | 1) => {
      if (step === -1 && !hasPrevious) return;
      if (step === 1 && !hasNext) return;

      const nextPage = currentPage + step;
      if (nextPage < 0 || nextPage >= pageCount) return;

      setDirection(step);

      onPageChange(nextPage);
    },
    [currentPage, pageCount, hasPrevious, hasNext, onPageChange],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
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
    [movePage],
  );

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
          내 동화 {totalElements}편
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

      <View pointerEvents="box-none" style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
        <Animated.View
          key={currentPage}
          pointerEvents="box-none"
          style={StyleSheet.absoluteFill}
          entering={
            direction === 0 ? undefined : direction === 1 ? ENTER_FROM_RIGHT : ENTER_FROM_LEFT
          }
        >
          {lastPoint ? (
            <ConstellationEdgeHints
              firstPoint={POSITIONS[0]}
              lastPoint={lastPoint}
              hasPrevious={hasPrevious}
              hasNext={hasNext}
            />
          ) : null}

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
                <StoryStar story={story} onPress={onSelectStory} />
              </View>
            );
          })}
        </Animated.View>
      </View>
      {hasPrevious ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="이전 쪽"
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
          onPress={() => movePage(1)}
          style={({ pressed }) => [styles.pageButton, styles.nextButton, pressed && styles.pressed]}
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
            {Array.from({ length: pageCount }, (_, index) => (
              <View
                key={index}
                style={[styles.pageDot, index === currentPage && styles.activePageDot]}
              />
            ))}
            <Text maxFontSizeMultiplier={1.2} style={styles.pageText}>
              {currentPage + 1} / {pageCount}
            </Text>
          </View>
          {pageCount > 1 ? (
            <Text maxFontSizeMultiplier={1.2} style={styles.pageHint}>
              다른 쪽에도 내가 만든 동화가 있어요
            </Text>
          ) : null}
        </View>
      ) : null}

      {stories.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>아직 이 섬에 동화가 없어요</Text>
        </View>
      ) : null}
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
    backgroundColor: STAR.yellow.c300,
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
