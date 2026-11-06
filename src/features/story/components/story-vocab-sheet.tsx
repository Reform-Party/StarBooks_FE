import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Icon from '@/components/ui/icon';
import { INK, STAR } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import type { StoryVocab } from '@/features/story/api/types';

const SHEET_WIDTH = 360;

type Props = {
  vocab: StoryVocab[];
  onClose: () => void;
};

export default function StoryVocabSheet({ vocab, onClose }: Props) {
  const [translateX] = useState(() => new Animated.Value(SHEET_WIDTH));
  const closing = useRef(false);

  useEffect(() => {
    const animation = Animated.timing(translateX, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });

    animation.start();

    return () => animation.stop();
  }, [translateX]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;

    Animated.timing(translateX, {
      toValue: SHEET_WIDTH,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start(({ finished }) => {
      if (finished) onClose();
    });
  }, [onClose, translateX]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });

    return () => subscription.remove();
  }, [close]);

  return (
    <View style={styles.overlay} accessibilityViewIsModal onAccessibilityEscape={close}>
      <Pressable accessible={false} onPress={close} style={styles.scrim} />

      <Animated.View style={[styles.sheet, { transform: [{ translateX }] }]}>
        <View style={styles.header}>
          <Text accessibilityRole="header" maxFontSizeMultiplier={1.2} style={styles.heading}>
            단어장
          </Text>

          <View style={styles.countBadge}>
            <Text maxFontSizeMultiplier={1.2} style={styles.count}>
              {vocab.length}개
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="단어장 닫기"
            onPress={close}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Icon name="x" scale={1.3} />
          </Pressable>
        </View>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {vocab.length === 0 ? (
            <Text maxFontSizeMultiplier={1.2} style={styles.empty}>
              아직 등록된 단어가 없어요.
            </Text>
          ) : (
            vocab.map((entry) => (
              <View key={entry.wordEntryId} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text maxFontSizeMultiplier={1.2} style={styles.word}>
                    {entry.word}
                  </Text>

                  <View style={styles.pageBadge}>
                    <Text maxFontSizeMultiplier={1.2} style={styles.page}>
                      {entry.pageNo}쪽
                    </Text>
                  </View>
                </View>

                <Text maxFontSizeMultiplier={1.2} style={styles.meaning}>
                  {entry.meaning}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    overflow: 'hidden',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5,6,18,0.18)',
  },
  sheet: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: SHEET_WIDTH,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: 'rgba(25,25,53,0.96)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    marginBottom: 6,
  },
  heading: {
    fontFamily: FONT.hand,
    fontSize: 26,
    color: INK[1],
    includeFontPadding: false,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: STAR.yellow.rim,
    backgroundColor: 'rgba(255,232,130,0.12)',
  },
  count: {
    fontFamily: FONT.sansBold,
    fontSize: 13,
    color: STAR.yellow.rim,
    includeFontPadding: false,
  },
  closeButton: {
    marginLeft: 'auto',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 8,
    paddingBottom: 24,
  },
  card: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(209,190,255,0.38)',
    backgroundColor: 'rgba(147,113,221,0.24)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  word: {
    flex: 1,
    fontFamily: FONT.hand,
    fontSize: 25,
    lineHeight: 30,
    color: STAR.yellow.rim,
    includeFontPadding: false,
  },
  pageBadge: {
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  page: {
    fontFamily: FONT.sansBold,
    fontSize: 12,
    color: INK[1],
    includeFontPadding: false,
  },
  meaning: {
    fontFamily: FONT.sans,
    fontSize: 14,
    lineHeight: 21,
    color: INK[2],
    includeFontPadding: false,
  },
  empty: {
    paddingVertical: 30,
    textAlign: 'center',
    fontFamily: FONT.sans,
    fontSize: 15,
    color: INK[2],
  },
});
