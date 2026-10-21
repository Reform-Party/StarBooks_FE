import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import type { GameNode } from '@/features/commentary/api/types';
import GlassIconButton from '@/components/ui/glass-icon-button';
import TrayItem, { type TrayDrag } from '@/features/commentary/components/tray-item';
import { TRAY } from '@/features/commentary/constants/board';
import { GLASS, SKY } from '@/constants/colors';

type Props = {
  nodes: GameNode[];
  selectedId: number | null;
  draggingId: number | null;
  disabled: boolean;
  drag: TrayDrag;
  onSelect: (id: number | null) => void;
};

// 아래 별 트레이: 한 줄로 옆으로 넘겨요. 옆으로 밀면 스크롤, 위로 끌어올리면 드래그가 시작돼요.
// (별의 끌기 제스처와 스크롤이 서로 양보하도록 gesture-handler 의 FlatList 를 써요)
export default function NodeTray({
  nodes,
  selectedId,
  draggingId,
  disabled,
  drag,
  onSelect,
}: Props) {
  const list = useRef<FlatList<GameNode>>(null);
  const offset = useRef(0);
  return (
    <View style={styles.tray}>
      <FlatList
        ref={list}
        horizontal
        data={nodes}
        keyExtractor={(n) => String(n.id)}
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          offset.current = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={32}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <TrayItem
            node={item}
            selected={selectedId === item.id}
            hidden={draggingId === item.id}
            disabled={disabled}
            drag={drag}
            onSelect={onSelect}
          />
        )}
      />
      {/* 오른쪽이 더 있다는 걸 알려주는 페이드 (디자인 mask 88% → 100%) */}
      <View pointerEvents="none" style={styles.fade}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="tray-fade" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={SKY.mid} stopOpacity={0} />
              <Stop offset="1" stopColor={SKY.mid} stopOpacity={0.95} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#tray-fade)" />
        </Svg>
      </View>
      <GlassIconButton
        icon="chevronRight"
        size={30}
        label="별 더 보기"
        style={styles.more}
        onPress={() =>
          // 디자인: 목록 한 화면 스크롤
          list.current?.scrollToOffset({ offset: offset.current + TRAY.w, animated: true })
        }
      />
    </View>
  );
}

// 2단계로 넘어갈 때 아래로 사라지는 빈 트레이 틀도 같은 모양을 써요
export const TRAY_FRAME = {
  position: 'absolute',
  left: TRAY.left,
  top: TRAY.top,
  width: TRAY.w,
  height: TRAY.h,
  borderRadius: 18,
  backgroundColor: 'rgba(255,255,255,0.04)',
  borderWidth: 1,
  borderColor: GLASS.line,
} as const;

const styles = StyleSheet.create({
  tray: { ...TRAY_FRAME, overflow: 'hidden' },
  content: { alignItems: 'center', gap: 6, paddingHorizontal: 14, height: '100%' },
  fade: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 90 },
  more: { position: 'absolute', left: 716, top: 26 },
});
