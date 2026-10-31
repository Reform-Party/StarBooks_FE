import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { GameNode } from '@/features/commentary/api/types';
import Text from '@/features/commentary/components/app-text';
import JellyStar from '@/components/ui/jelly-star';
import { type Area, TRAY_STAR } from '@/features/commentary/constants/board';
import { FONT } from '@/constants/fonts';
import { INK, STAR } from '@/constants/colors';
import { usePulse } from '@/features/commentary/hooks/use-motion';
import { type CanvasFrame, toDesign } from '@/features/commentary/hooks/use-canvas';
import { basketAt, CATEGORY_COLOR } from '@/features/commentary/utils/game-logic';

// 손가락 위치는 UI 스레드에서 x · y 에 바로 써서 별이 늦지 않게 따라와요.
// 화면이 알아야 하는 순간(시작 · 바구니 바뀜 · 놓음)만 JS 로 알려요.
export type TrayDrag = {
  frame: SharedValue<CanvasFrame>;
  x: SharedValue<number>;
  y: SharedValue<number>;
  hot: SharedValue<number>;
  // 지금 끄는 별 id (-1: 없음). 두 손가락으로 두 별을 끌면 먼저 잡은 별만 움직여요.
  owner: SharedValue<number>;
  area: Area;
  basketCount: number;
  onStart: (id: number, x: number, y: number) => void;
  onHot: (basket: number) => void;
  onDrop: (id: number, x: number, y: number) => void;
  onCancel: () => void;
};

type Props = {
  node: GameNode;
  selected: boolean;
  hidden: boolean;
  disabled: boolean;
  drag: TrayDrag;
  onSelect: (id: number | null) => void;
};

// 트레이 별 하나. 위로 끌어올리면 드래그, 톡 누르면 선택(끌기 어려운 아이 · 스크린 리더용).
// 시안처럼 분류될 영역 색으로 그려요 (같은 색 = 힌트).
export default function TrayItem({ node, selected, hidden, disabled, drag, onSelect }: Props) {
  const pulse = usePulse(selected);
  const { frame, x, y, hot, owner, area, basketCount, onStart, onHot, onDrop, onCancel } = drag;
  const id = node.id;

  // 위아래로 움직였을 때만 가져가고, 옆으로 미는 건 트레이 스크롤에 양보해요.
  const pan = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetY([-8, 8])
    .failOffsetX([-12, 12])
    .onStart((e) => {
      if (owner.value !== -1) return;
      owner.set(id);
      const p = toDesign(frame.value, e.absoluteX, e.absoluteY);
      x.set(p.x);
      y.set(p.y);
      hot.set(-1);
      scheduleOnRN(onStart, id, p.x, p.y);
    })
    .onUpdate((e) => {
      if (owner.value !== id) return;
      const p = toDesign(frame.value, e.absoluteX, e.absoluteY);
      x.set(p.x);
      y.set(p.y);
      const i = basketAt(p, basketCount, area);
      if (i !== hot.value) {
        hot.set(i);
        scheduleOnRN(onHot, i);
      }
    })
    // 정상적으로 손을 뗐을 때만 놓기예요. (판정 중 비활성화로 취소돼도 onEnd 가 success=false 로 불려요)
    .onEnd((_, success) => {
      if (owner.value === id && success) scheduleOnRN(onDrop, id, x.value, y.value);
    })
    .onFinalize((_, success) => {
      if (owner.value !== id) return;
      owner.set(-1);
      if (!success) scheduleOnRN(onCancel);
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={[styles.item, hidden && styles.hidden]}>
        <Pressable
          disabled={disabled}
          onPress={() => onSelect(selected ? null : id)}
          accessibilityRole="button"
          accessibilityLabel={`${node.word} 별`}
          accessibilityHint="고른 뒤 알맞은 바구니를 눌러 넣어요"
          accessibilityState={{ selected, disabled }}
          style={({ pressed }) => [
            styles.press,
            pressed && styles.pressed,
            selected && styles.lifted,
          ]}
        >
          <View style={styles.star}>
            {selected ? (
              <>
                <View style={styles.ring} />
                <Animated.View style={[styles.ring, pulse]} />
              </>
            ) : null}
            <JellyStar color={CATEGORY_COLOR[node.category]} size={TRAY_STAR} />
          </View>
          <Text style={styles.name} numberOfLines={2}>
            {node.word}
          </Text>
        </Pressable>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  item: { minWidth: 96, maxWidth: 130, alignItems: 'center' },
  hidden: { opacity: 0.15 },
  press: { alignItems: 'center', gap: 4, paddingVertical: 4 },
  pressed: { transform: [{ scale: 0.92 }] },
  lifted: { transform: [{ translateY: -4 }] },
  star: { width: TRAY_STAR, height: TRAY_STAR },
  name: {
    fontFamily: FONT.sansBold,
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: -0.26,
    color: INK[1],
    textAlign: 'center',
  },
  ring: {
    position: 'absolute',
    left: -7,
    top: -7,
    width: TRAY_STAR + 14,
    height: TRAY_STAR + 14,
    borderRadius: (TRAY_STAR + 14) / 2,
    borderWidth: 1.5,
    borderColor: STAR.yellow.c300,
  },
});
