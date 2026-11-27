import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeInLeft, FadeInRight } from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';

import ClickPressable from '@/components/ui/click-pressable';
import JellyStar from '@/components/ui/jelly-star';
import { INK, STAR } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { SCREEN } from '@/constants/layout';
import ConstellationEdgeHints from '@/features/explore/components/constellation-edge-hints';
import { STORY_STAR_SIZE, STORY_STAR_ICON_SIZE } from '@/features/explore/components/story-star';
import { STORY_POSITIONS as POSITIONS } from '@/features/explore/constants/constellation';
import {
  useConstellationPagination,
  type ConstellationPagination,
} from '@/features/explore/hooks/use-constellation-pagination';
import type { StorySummary } from '@/features/explore/types/story';

type Props<T extends StorySummary> = {
  stories: T[];
  pagination: ConstellationPagination;
  tone: 'mint' | 'yellow';
  renderStar: (story: T) => ReactNode;
  emptyText: string;
  pageHint: string;
  busy?: boolean;
  blocked?: boolean;
  edgeHints?: boolean;
  maxPageDots?: number;
  showEmptySlots?: boolean;
};

const ENTER_FROM_RIGHT = FadeInRight.duration(350).easing(Easing.out(Easing.cubic));
const ENTER_FROM_LEFT = FadeInLeft.duration(350).easing(Easing.out(Easing.cubic));

export default function ConstellationMapBody<T extends StorySummary>({
  stories,
  pagination,
  tone,
  renderStar,
  emptyText,
  pageHint,
  busy = false,
  blocked = false,
  edgeHints = false,
  maxPageDots = Infinity,
  showEmptySlots = false,
}: Props<T>) {
  const { direction, movePage, panResponder } = useConstellationPagination(
    pagination,
    busy || blocked,
  );
  const { page: currentPage, totalPages: pageCount, hasPrevious, hasNext } = pagination;
  const visibleStories = stories.slice(0, POSITIONS.length);
  const visiblePositions = showEmptySlots ? POSITIONS : POSITIONS.slice(0, visibleStories.length);
  const lastPoint = visiblePositions[visiblePositions.length - 1];

  return (
    <>
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
        <Animated.View
          key={currentPage}
          pointerEvents="box-none"
          style={StyleSheet.absoluteFill}
          entering={
            direction === 0 ? undefined : direction === 1 ? ENTER_FROM_RIGHT : ENTER_FROM_LEFT
          }
        >
          {edgeHints && lastPoint ? (
            <ConstellationEdgeHints
              firstPoint={POSITIONS[0]}
              lastPoint={lastPoint}
              hasPrevious={hasPrevious}
              hasNext={hasNext}
            />
          ) : null}

          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Svg width={SCREEN.width} height={SCREEN.height}>
              {visiblePositions.slice(1).map((end, index) => {
                const start = POSITIONS[index];

                return (
                  <Line
                    key={index}
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={STAR[tone].rim}
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

          {visiblePositions.map((point, index) => {
            const story = visibleStories[index];

            return (
              <View
                key={story?.id ?? `empty-${index}`}
                pointerEvents={story ? 'auto' : 'none'}
                accessibilityElementsHidden={!story}
                importantForAccessibility={story ? 'auto' : 'no-hide-descendants'}
                style={[
                  styles.starSlot,
                  {
                    left: point.x - STORY_STAR_SIZE / 2,
                    top: point.y - STORY_STAR_SIZE / 2,
                  },
                ]}
              >
                {story ? (
                  renderStar(story)
                ) : (
                  <View style={styles.emptyStar}>
                    <JellyStar size={STORY_STAR_ICON_SIZE} color={tone} />
                  </View>
                )}
              </View>
            );
          })}
        </Animated.View>
      </View>

      {hasPrevious ? (
        <ClickPressable
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
        </ClickPressable>
      ) : null}

      {hasNext ? (
        <ClickPressable
          accessibilityRole="button"
          accessibilityLabel="다음 쪽"
          disabled={busy}
          accessibilityState={{ disabled: busy }}
          onPress={() => movePage(1)}
          style={({ pressed }) => [styles.pageButton, styles.nextButton, pressed && styles.pressed]}
        >
          <Text maxFontSizeMultiplier={1.2} style={styles.arrowText}>
            ›
          </Text>
        </ClickPressable>
      ) : null}

      {pageCount > 0 ? (
        <View style={styles.footer}>
          <View
            accessible
            accessibilityLabel={`${pageCount}쪽 중 ${currentPage + 1}쪽`}
            style={styles.pageIndicator}
          >
            {pageCount <= maxPageDots
              ? Array.from({ length: pageCount }, (_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.pageDot,
                      index === currentPage && [
                        styles.activePageDot,
                        { backgroundColor: STAR[tone].c300 },
                      ],
                    ]}
                  />
                ))
              : null}
            <Text maxFontSizeMultiplier={1.2} style={styles.pageText}>
              {currentPage + 1} / {pageCount}
            </Text>
          </View>

          {pageCount > 1 ? (
            <Text maxFontSizeMultiplier={1.2} style={styles.pageHint}>
              {pageHint}
            </Text>
          ) : null}
        </View>
      ) : null}

      {stories.length === 0 && emptyText ? (
        <View pointerEvents="none" style={[styles.empty, showEmptySlots && styles.emptyBelowMap]}>
          <Text maxFontSizeMultiplier={1.2} style={styles.emptyText}>
            {emptyText}
          </Text>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  emptyStar: {
    width: STORY_STAR_SIZE,
    height: STORY_STAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.3,
  },
  emptyBelowMap: { top: 'auto', bottom: SCREEN.safeBottom },
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
