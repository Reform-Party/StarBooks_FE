import { Pressable, StyleSheet, Text, View } from 'react-native';

import CenterModal from '@/components/ui/center-modal';
import JellyStar from '@/components/ui/jelly-star';
import { GLASS, INK, STAR } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import type { StorySummary } from '@/features/explore/types/story';

type Props = {
  story: StorySummary | null;
  islandName: string;
  authorName?: string;
  onClose: () => void;
  onRead: (story: StorySummary) => void;
  onCommentary?: (story: StorySummary) => void;
};

export default function StorySelectModal({
  story,
  islandName,
  authorName,
  onClose,
  onRead,
  onCommentary,
}: Props) {
  return (
    <CenterModal visible={story !== null} onRequestClose={onClose} panelStyle={styles.panel}>
      {story ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="동화 선택 닫기"
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Text maxFontSizeMultiplier={1.2} style={styles.closeText}>
              ×
            </Text>
          </Pressable>

          <View style={styles.badge}>
            <Text maxFontSizeMultiplier={1.2} style={styles.badgeText}>
              {islandName}
            </Text>
          </View>

          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={1.2}
            numberOfLines={2}
            style={styles.title}
          >
            {story.title}
          </Text>

          {authorName ? (
            <Text maxFontSizeMultiplier={1.2} numberOfLines={1} style={styles.author}>
              글 · {authorName}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${story.title}, 동화 읽기`}
              onPress={() => onRead(story)}
              style={({ pressed }) => [styles.card, styles.readCard, pressed && styles.pressed]}
            >
              <View accessible={false} pointerEvents="none">
                <JellyStar size={35} color="yellow" />
              </View>
              <Text maxFontSizeMultiplier={1.2} style={[styles.cardTitle, styles.readText]}>
                동화 읽기
              </Text>
              <Text maxFontSizeMultiplier={1.2} style={styles.description}>
                책을 펼쳐 읽어요
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${story.title}, 동화 해설`}
              disabled={!onCommentary}
              accessibilityState={{ disabled: !onCommentary }}
              onPress={() => onCommentary?.(story)}
              style={({ pressed }) => [
                styles.card,
                styles.commentaryCard,
                pressed && styles.pressed,
              ]}
            >
              <View accessible={false} pointerEvents="none">
                <JellyStar size={35} color="mint" />
              </View>
              <Text maxFontSizeMultiplier={1.2} style={[styles.cardTitle, styles.commentaryText]}>
                동화 해설
              </Text>
                <Text maxFontSizeMultiplier={1.2} style={styles.description}>
                {onCommentary ? '카드로 이야기를 정리해요' : '동화 해설은 준비 중이에요'}
                </Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </CenterModal>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: 480,
    padding: 22,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: GLASS.line,
    backgroundColor: GLASS.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontFamily: FONT.sans,
    fontSize: 24,
    lineHeight: 28,
    color: INK[1],
    includeFontPadding: false,
  },
  badge: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: STAR.yellow.rim,
    backgroundColor: 'rgba(253,230,138,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: FONT.sansBold,
    fontSize: 12,
    color: STAR.yellow.rim,
    includeFontPadding: false,
  },
  title: {
    marginTop: 8,
    maxWidth: 350,
    fontFamily: FONT.hand,
    fontSize: 28,
    lineHeight: 34,
    color: INK[1],
    textAlign: 'center',
    includeFontPadding: false,
  },
  author: {
    marginTop: 6,
    maxWidth: 350,
    fontFamily: FONT.sans,
    fontSize: 14,
    lineHeight: 20,
    color: INK[3],
    includeFontPadding: false,
  },
  actions: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'stretch',
  },
  card: {
    flex: 1,
    minHeight: 134,
    paddingHorizontal: 8,
    paddingVertical: 16,
    borderWidth: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  readCard: {
    borderColor: 'rgba(253,230,138,0.45)',
    backgroundColor: 'rgba(253,230,138,0.08)',
  },
  commentaryCard: {
    borderColor: 'rgba(167,243,208,0.45)',
    backgroundColor: 'rgba(167,243,208,0.08)',
  },
  cardTitle: {
    fontFamily: FONT.hand,
    fontSize: 26,
    lineHeight: 32,
    includeFontPadding: false,
  },
  readText: {
    color: STAR.yellow.rim,
  },
  commentaryText: {
    color: STAR.mint.rim,
  },
  description: {
    fontFamily: FONT.sans,
    fontSize: 13,
    lineHeight: 18,
    color: INK[3],
    textAlign: 'center',
    includeFontPadding: false,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
});
