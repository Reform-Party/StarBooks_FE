import { Image } from 'expo-image';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
import type { StoryPage } from '@/features/story/api/types';

const PAPER_INK_2 = '#6B6790';

type Props = {
  title: string | null;
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
  pages,
  totalPages,
  streaming,
  error,
  onRetry,
  onHome,
}: Props) {
  const [index, setIndex] = useState(0);
  const page = pages[index];
  // 다음 쪽은 글이 한 글자라도 도착해야 넘길 수 있어요.
  const hasNext = index < totalPages - 1;
  const canNext = hasNext && !!pages[index + 1]?.text;
  const writing = streaming && !!page && (!pages[index + 1]?.text || !page.imageUrl);

  return (
    <Stage>
      <View style={styles.header}>
        <Text numberOfLines={1} accessibilityRole="header" style={styles.title}>
          {title ?? '제목을 짓는 중…'}
        </Text>
        {streaming ? <Chip label="뒷이야기를 쓰는 중" tone="mint" /> : null}
      </View>

      <View style={styles.book}>
        <Cover />
        <View style={[styles.leaf, styles.leftLeaf]}>
          {page?.imageUrl ? (
            <Image
              source={{ uri: page.imageUrl }}
              accessibilityLabel={`${index + 1}쪽 그림`}
              style={styles.illustration}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.skeleton}>
              <Text style={styles.skeletonText}>그림을 그리는 중…</Text>
            </View>
          )}
        </View>
        <View style={[styles.leaf, styles.rightLeaf]}>
          <ScrollView style={styles.bodyScroll}>
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

      <View style={styles.bottomNav} pointerEvents="box-none">
        <JellyButton
          tone="glass"
          label="이전"
          icon={<Icon name="chevronLeft" scale={0.8} />}
          height={36}
          disabled={index === 0}
          onPress={() => setIndex((i) => i - 1)}
        />
        {onRetry ? (
          <JellyButton label="다시 만들기" height={36} onPress={onRetry} />
        ) : (
          <JellyButton
            label={hasNext && !canNext ? '쓰는 중…' : '다음'}
            height={36}
            disabled={!canNext}
            onPress={() => setIndex((i) => i + 1)}
          />
        )}
      </View>
      <GlassIconButton icon="home" label="메인으로" onPress={onHome} style={styles.home} />
    </Stage>
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
  header: {
    position: 'absolute',
    top: 14,
    left: 120,
    right: 120,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
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
    left: SCREEN.safeX,
    right: SCREEN.safeX,
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
  // 이전(왼쪽 끝 x 59) · 다음(오른쪽 끝 x 815) · y 349
  bottomNav: {
    position: 'absolute',
    left: SCREEN.safeX,
    right: SCREEN.safeX,
    top: 349,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  home: { position: 'absolute', top: SCREEN.topBarY, left: SCREEN.homeButtonX },
});
