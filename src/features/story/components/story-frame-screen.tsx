import StoryNarrationButton from '@/features/story/components/story-narration-button';
import { Image } from 'expo-image';
import { useCallback, useMemo, useState } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import Chip from '@/components/ui/chip';
import GlassIconButton from '@/components/ui/glass-icon-button';
import Icon from '@/components/ui/icon';
import JellyButton from '@/components/ui/jelly-button';
import Stage from '@/components/ui/stage';
import { PAPER, STAR } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { RADIUS, SCREEN } from '@/constants/layout';
import { TYPE } from '@/constants/typography';
import type { StoryPage, StoryVocab } from '@/features/story/api/types';
import StoryVocabSheet from '@/features/story/components/story-vocab-sheet';

const PAPER_INK_2 = '#6B6790';

type Props = {
  title: string | null;
  authorName?: string;
  vocab?: StoryVocab[];
  pages: StoryPage[];
  totalPages: number;
  // 아직 뒷이야기를 받고 있어요.
  streaming: boolean;
  // 불러오기 · 생성 실패 문구
  error: string | null;
  // 생성 중 실패했을 때만 "다시 만들기" 를 보여 줘요.
  onRetry?: () => void;
  onHome: () => void;
};

// 동화 페이지 프레임 — SSE 로 들어오는 글 · 그림을 받는 대로 채워요.
// 책 속지 Paper · 보라 표지 · 본문 ONE Mobile POP 21.5 / 1.75
// ※ 읽기 화면 최종 UI(책 넘김 · 단어장 · 낭독)는 ② 솔 / ④ 준석 파트에서 이 프레임을 이어받아요.
export default function StoryFrameScreen({
  title,
  authorName,
  vocab = [],
  pages,
  totalPages,
  streaming,
  error,
  onRetry,
  onHome,
}: Props) {
  const [index, setIndex] = useState(0);
  const [vocabOpen, setVocabOpen] = useState(false);
  const page = pages[index];
  const progress = totalPages > 0 && page ? Math.min((index + 1) / totalPages, 1) : 0;
  // 다음 쪽은 글이 한 글자라도 도착해야 넘길 수 있어요.
  const hasNext = index < totalPages - 1;
  const canNext = hasNext && !!pages[index + 1]?.text;
  const writing = streaming && !!page && (!pages[index + 1]?.text || !page.imageUrl);
  const movePage = useCallback(
    (step: -1 | 1) => {
      setIndex((current) => {
        const next = current + step;

        if (next < 0 || next >= totalPages) return current;
        if (step === 1 && !pages[next]?.text) return current;

        return next;
      });
    },
    [pages, totalPages],
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
    <Stage>
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents={vocabOpen ? 'none' : 'auto'}
        accessibilityElementsHidden={vocabOpen}
        importantForAccessibility={vocabOpen ? 'no-hide-descendants' : 'auto'}
      >
        <View style={styles.header}>
          {authorName?.trim() ? (
            <View style={styles.authorBadge}>
              <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={styles.authorText}>
                글 · {authorName} 작가
              </Text>
            </View>
          ) : null}
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
            accessibilityRole="header"
            style={styles.title}
          >
            {title ?? '제목을 짓는 중…'}
          </Text>
          {streaming ? <Chip label="뒷이야기를 쓰는 중" tone="mint" /> : null}
        </View>

        <View collapsable={false} style={styles.book} {...panResponder.panHandlers}>
          <Cover />
          <View style={[styles.leaf, styles.leftLeaf]}>
            <StoryIllustration
              key={`${page?.page ?? index}:${page?.imageUrl ?? 'empty'}`}
              imageUrl={page?.imageUrl ?? null}
              pageNumber={page?.page ?? index + 1}
              streaming={streaming}
            />
          </View>
          <View style={[styles.leaf, styles.rightLeaf]}>
            <ScrollView key={index} style={styles.bodyScroll}>
              <Text selectable style={styles.body}>
                {page?.text}
                {writing ? <Text style={styles.caret}> ▍</Text> : null}
              </Text>
            </ScrollView>
            <Text style={styles.pageNo}>
              {index + 1} / {totalPages || '…'}
            </Text>
          </View>
        </View>

        {error ? (
          <Text accessibilityRole="alert" style={[TYPE.caption, styles.error]}>
            {error}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="이전 쪽"
          accessibilityState={{ disabled: index === 0 }}
          disabled={index === 0}
          onPress={() => movePage(-1)}
          style={({ pressed }) => [
            styles.pageButton,
            styles.previousButton,
            index === 0 && styles.disabledButton,
            pressed && styles.pressedButton,
          ]}
        >
          <Icon name="chevronLeft" scale={0.8} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={hasNext && !canNext ? '다음 쪽을 쓰는 중' : '다음 쪽'}
          accessibilityState={{ disabled: !canNext }}
          disabled={!canNext}
          onPress={() => movePage(1)}
          style={({ pressed }) => [
            styles.pageButton,
            styles.nextButton,
            !canNext && styles.disabledButton,
            pressed && styles.pressedButton,
          ]}
        >
          <View style={styles.rightArrow} pointerEvents="none">
            <Icon name="chevronLeft" scale={0.8} />
          </View>
        </Pressable>

        {onRetry ? (
          <View style={styles.retryButton}>
            <JellyButton label="다시 만들기" height={36} onPress={onRetry} />
          </View>
        ) : null}
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel="동화 읽기 진행률"
          accessibilityValue={{
            min: 0,
            max: 100,
            now: Math.round(progress * 100),
          }}
          style={styles.progressTrack}
        >
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <GlassIconButton
          icon="book"
          label="단어장 열기"
          onPress={() => setVocabOpen(true)}
          style={styles.vocabButton}
        />

        <StoryNarrationButton
          key={`${index}:${page?.ttsUrl ?? 'empty'}`}
          uri={page?.ttsUrl ?? null}
        />

        <GlassIconButton
          icon="home"
          label="메인으로"
          onPress={onHome}
          style={styles.home}
        />
      </View>

      {vocabOpen ? <StoryVocabSheet vocab={vocab} onClose={() => setVocabOpen(false)} /> : null}
    </Stage>
  );
}
function StoryIllustration({
  imageUrl,
  pageNumber,
  streaming,
}: {
  imageUrl: string | null;
  pageNumber: number;
  streaming: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (imageUrl && !failed) {
    return (
      <Image
        source={{ uri: imageUrl }}
        accessibilityLabel={`${pageNumber}쪽 그림`}
        style={styles.illustration}
        contentFit="cover"
        transition={200}
        onError={() => setFailed(true)}
      />
    );
  }

  const waiting = streaming && !imageUrl;

  return (
    <View style={styles.skeleton}>
      <Text maxFontSizeMultiplier={1.2} style={[styles.skeletonText, { textAlign: 'center' }]}>
        {waiting ? '그림을 그리는 중…' : '그림을 표시할 수 없어요.\n이야기는 계속 읽을 수 있어요.'}
      </Text>
    </View>
  );
}
// 책 표지: 보라 500 → 800 세로 그라데이션
function Cover() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="story-cover" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={STAR.purple.c500} />
            <Stop offset="1" stopColor={STAR.purple.deep} />
          </LinearGradient>
        </Defs>
        <Rect
          width="100%"
          height="100%"
          rx={RADIUS.basket}
          ry={RADIUS.basket}
          fill="url(#story-cover)"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  vocabButton: {
    position: 'absolute',
    top: SCREEN.topBarY,
    left: SCREEN.homeButtonX - 104,
  },
  header: {
    position: 'absolute',
    top: 14,
    left: SCREEN.safeX,
    right: 210,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorBadge: {
    maxWidth: 150,
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  authorText: {
    fontFamily: FONT.sansBold,
    fontSize: 13,
    color: '#FFFFFF',
    includeFontPadding: false,
  },
  title: {
    ...TYPE.heading,
    flexShrink: 1,
    color: STAR.yellow.c300,
    textShadowColor: `${STAR.yellow.c300}55`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  // 책 펼침면: 보라 표지 위 종이 두 장 (왼쪽: 그림 · 오른쪽: 글)
  book: {
    position: 'absolute',
    left: 104,
    right: 104,
    top: 62,
    height: 274,
    padding: 8,
    flexDirection: 'row',
  },
  leaf: { flex: 1, backgroundColor: PAPER.fill },
  leftLeaf: {
    padding: 14,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    borderRightWidth: 1,
    borderRightColor: PAPER.edge,
  },
  rightLeaf: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 10,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  illustration: { flex: 1, borderRadius: RADIUS.chip },
  skeleton: {
    flex: 1,
    borderRadius: RADIUS.chip,
    backgroundColor: PAPER.edge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonText: { ...TYPE.caption, color: PAPER_INK_2 },
  bodyScroll: { flex: 1 },
  body: { fontFamily: FONT.pop, fontSize: 21.5, lineHeight: 37.6, color: PAPER.ink },
  caret: { color: STAR.yellow.c500 },
  pageNo: {
    alignSelf: 'flex-end',
    fontFamily: FONT.sansBold,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    color: PAPER_INK_2,
  },
  error: {
    position: 'absolute',
    top: 312,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: STAR.pink.c300,
  },
  pageButton: {
    position: 'absolute',
    top: 177,
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
    left: 58,
  },
  nextButton: {
    right: 58,
  },
  rightArrow: {
    transform: [{ rotate: '180deg' }],
  },
  disabledButton: {
    opacity: 0.3,
  },
  pressedButton: {
    opacity: 0.7,
  },
  retryButton: {
    position: 'absolute',
    top: 359,
    alignSelf: 'center',
  },
  progressTrack: {
    position: 'absolute',
    top: 346,
    left: 287,
    right: 287,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: STAR.yellow.c300,
  },
  home: { position: 'absolute', top: SCREEN.topBarY, left: SCREEN.homeButtonX },
});
