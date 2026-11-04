import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import Stage from '@/components/ui/stage';
import { GLASS, INK, STAR } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import type { SharedStorySummary } from '@/features/explore/api/shared-stories-api';
import SharedConstellationMapScreen from '@/features/explore/components/shared-constellation-map-screen';
import { useSharedStories } from '@/features/explore/hooks/use-shared-stories';
import { API_URL } from '@/lib/api-client';

type Props = {
  onHome: () => void;
  onSelectStory: (story: SharedStorySummary) => void;
};

export default function SharedStoriesScreen({ onHome, onSelectStory }: Props) {
  const [page, setPage] = useState(0);
  const query = useSharedStories(page);

  if (!API_URL || query.isPending || query.isError) {
    const loading = Boolean(API_URL) && query.isPending;
    const message = !API_URL
      ? '동화 여행에 연결할 수 없어요. 잠시 후 다시 이용해 주세요.'
      : loading
        ? query.fetchStatus === 'paused'
          ? '인터넷 연결을 기다리고 있어요'
          : '친구들의 동화를 불러오고 있어요'
        : '동화 목록을 불러오지 못했어요';

    return (
      <Stage orientation="landscape">
        <View style={styles.status}>
          <Text accessibilityRole="header" maxFontSizeMultiplier={1.2} style={styles.heading}>
            동화 여행
          </Text>
          {loading ? <ActivityIndicator size="large" color={STAR.mint.rim} /> : null}
          <Text
            accessibilityRole={loading ? undefined : 'alert'}
            maxFontSizeMultiplier={1.2}
            style={styles.message}
          >
            {message}
          </Text>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={onHome} style={styles.button}>
              <Text maxFontSizeMultiplier={1.2} style={styles.buttonText}>
                메인으로
              </Text>
            </Pressable>
            {API_URL && query.isError ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => void query.refetch()}
                style={styles.button}
              >
                <Text maxFontSizeMultiplier={1.2} style={styles.buttonText}>
                  다시 시도
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Stage>
    );
  }

  const result = query.data;
  const busy = query.isFetching || query.isPlaceholderData || query.fetchStatus === 'paused';

  return (
    <SharedConstellationMapScreen
      stories={result.stories}
      onHome={onHome}
      onSelectStory={onSelectStory}
      busy={busy}
      pagination={{
        page: result.page,
        totalPages: result.totalPages,
        totalElements: result.totalElements,
        hasPrevious: result.hasPrevious,
        hasNext: result.hasNext,
        onPageChange: (next) => {
          if (busy) return;
          if (!Number.isInteger(next) || next < 0 || next >= result.totalPages) return;
          setPage(next);
        },
      }}
    />
  );
}

const styles = StyleSheet.create({
  status: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 60,
  },
  heading: {
    fontFamily: FONT.hand,
    fontSize: 26,
    lineHeight: 33,
    color: STAR.mint.rim,
    textAlign: 'center',
    includeFontPadding: false,
  },
  message: {
    fontFamily: FONT.sans,
    fontSize: 16,
    lineHeight: 24,
    color: INK[2],
    textAlign: 'center',
    includeFontPadding: false,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    minHeight: 44,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: GLASS.line,
    backgroundColor: GLASS.fill,
  },
  buttonText: {
    fontFamily: FONT.sans,
    fontSize: 14,
    color: INK[1],
    includeFontPadding: false,
  },
});
