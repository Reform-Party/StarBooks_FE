import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import ClickPressable from '@/components/ui/click-pressable';
import Stage from '@/components/ui/stage';
import { INK, STAR } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { SCREEN } from '@/constants/layout';
import ConstellationLoading from '@/features/explore/components/constellation-loading';
import ConstellationMapBody from '@/features/explore/components/constellation-map-body';
import StoryStar from '@/features/explore/components/story-star';
import { STORIES_PAGE_SIZE } from '@/features/explore/constants/constellation';
import type { StorySummary } from '@/features/explore/types/story';
import { useSavedStories } from '@/features/offline/hooks/use-saved-stories';

type Props = {
  onSelectStory: (story: StorySummary) => void;
  // 연결되면 보여요. 누르면 로그인을 확인하고 원래 앱으로 돌아가요.
  onReconnect?: () => void;
  reconnecting?: boolean;
};

// 오프라인으로 켰을 때의 첫 화면. 기기에 저장한 동화만 별자리에 보여요.
export default function OfflineShelfScreen({ onSelectStory, onReconnect, reconnecting }: Props) {
  const { stories, hydrated } = useSavedStories();
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(stories.length / STORIES_PAGE_SIZE);
  // 저장한 동화가 줄어 지금 쪽이 사라지면 마지막 쪽을 보여 줘요.
  const current = Math.min(page, Math.max(totalPages - 1, 0));

  return (
    <Stage>
      <View style={styles.header} pointerEvents="none">
        <Text maxFontSizeMultiplier={1.2} accessibilityRole="header" style={styles.heading}>
          저장한 동화
        </Text>
        <Text maxFontSizeMultiplier={1.2} style={styles.count}>
          {hydrated ? `오프라인 · ${stories.length}편` : ' '}
        </Text>
      </View>

      {onReconnect ? (
        <ClickPressable
          accessibilityRole="button"
          accessibilityLabel="인터넷에 연결됐어요. 원래 화면으로 돌아가기"
          disabled={reconnecting}
          accessibilityState={{ disabled: reconnecting, busy: reconnecting }}
          onPress={onReconnect}
          style={({ pressed }) => [styles.reconnect, pressed && styles.pressed]}
        >
          <Text maxFontSizeMultiplier={1.2} style={styles.reconnectText}>
            {reconnecting ? '연결하는 중…' : '온라인으로 돌아가기'}
          </Text>
        </ClickPressable>
      ) : null}

      {hydrated ? (
        <ConstellationMapBody
          stories={stories.slice(current * STORIES_PAGE_SIZE, (current + 1) * STORIES_PAGE_SIZE)}
          pagination={{
            page: current,
            totalPages,
            totalElements: stories.length,
            hasPrevious: current > 0,
            hasNext: current < totalPages - 1,
            onPageChange: setPage,
          }}
          tone="yellow"
          edgeHints
          showEmptySlots
          emptyText="아직 저장한 동화가 없어요. 인터넷에 연결된 상태에서 읽은 동화가 여기에 저장돼요."
          pageHint="다른 쪽에도 저장한 동화가 있어요"
          renderStar={(story) => <StoryStar story={story} onPress={onSelectStory} />}
        />
      ) : (
        <ConstellationLoading tone="yellow" />
      )}
    </Stage>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 18,
    left: 220,
    right: 220,
    alignItems: 'center',
  },
  heading: {
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
  reconnect: {
    position: 'absolute',
    top: 12,
    right: SCREEN.safeX,
    minHeight: 44,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  reconnectText: {
    fontFamily: FONT.sans,
    fontSize: 14,
    color: INK[1],
  },
  pressed: {
    opacity: 0.7,
  },
});
