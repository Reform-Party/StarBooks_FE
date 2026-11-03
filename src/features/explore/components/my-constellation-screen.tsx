import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import Stage from '@/components/ui/stage';
import { GLASS, INK, STAR } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { fetchMyStories } from '@/features/explore/api/my-stories-api';
import ConstellationMapScreen from '@/features/explore/components/constellation-map-screen';
import type { Island } from '@/features/explore/constants/islands';
import type { StorySummary } from '@/features/explore/types/story';
import { API_URL } from '@/lib/api-client';

type Props = {
  island: Island;
  onBack: () => void;
  onSelectStory: (story: StorySummary) => void;
};

export default function MyConstellationScreen(props: Props) {
  return <MyConstellationContent key={props.island.id} {...props} />;
}

function MyConstellationContent({ island, onBack, onSelectStory }: Props) {
  const [page, setPage] = useState(0);

  const query = useQuery({
    queryKey: ['explore', 'my-stories', island.id, page],
    queryFn: ({ signal }) =>
      fetchMyStories({
        islandId: island.id,
        page,
        signal,
      }),
    enabled: Boolean(API_URL),
    retry: false,
    gcTime: 0,
  });

  if (!API_URL || query.isPending || query.isError) {
    const isLoading = Boolean(API_URL) && query.isPending;
    const message = isLoading
      ? query.fetchStatus === 'paused'
        ? '인터넷 연결을 기다리고 있어요'
        : '동화를 불러오고 있어요'
      : '동화 목록을 불러오지 못했어요';

    return (
      <Stage orientation="landscape">
        <View style={styles.status}>
          <Text maxFontSizeMultiplier={1.2} style={styles.heading}>
            {island.name}
          </Text>

          {isLoading ? <ActivityIndicator size="large" color={STAR.yellow.rim} /> : null}

          <Text maxFontSizeMultiplier={1.2} style={styles.message}>
            {message}
          </Text>

          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={onBack} style={styles.button}>
              <Text maxFontSizeMultiplier={1.2} style={styles.buttonText}>
                섬 선택
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

  return (
    <ConstellationMapScreen
      island={island}
      stories={result.stories}
      onBack={onBack}
      onSelectStory={onSelectStory}
      pagination={{
        page: result.page,
        totalPages: result.totalPages,
        totalElements: result.totalElements,
        hasPrevious: result.hasPrevious,
        hasNext: result.hasNext,
        onPageChange: setPage,
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
    color: STAR.yellow.rim,
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
