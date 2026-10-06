import { useState } from 'react';
import {
  Animated,
  type GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { GameNode } from '@/features/commentary/api/types';
import JellyStar from '@/features/commentary/components/jelly-star';
import { TRAY_STAR } from '@/features/commentary/constants/layout';
import { FONT, INK, STAR } from '@/features/commentary/constants/theme';
import { usePulse } from '@/features/commentary/hooks/use-motion';

export type TrayDrag = {
  start: (id: number, pageX: number, pageY: number) => void;
  move: (pageX: number, pageY: number) => void;
  end: (pageX: number, pageY: number) => void;
  cancel: () => void;
};

type Props = {
  node: GameNode;
  selected: boolean;
  hidden: boolean;
  disabled: boolean;
  drag: TrayDrag;
  onSelect: (id: number | null) => void;
};

const page = (e: GestureResponderEvent) => [e.nativeEvent.pageX, e.nativeEvent.pageY] as const;

// 트레이 별 하나. 위로 끌어올리면 드래그, 톡 누르면 선택(끌기 어려운 아이 · 보이스오버용).
// 분류 전이라 색으로 정답을 알려주지 않게 회색 별로 보여줘요.
export default function TrayItem({ node, selected, hidden, disabled, drag, onSelect }: Props) {
  const pulse = usePulse(selected);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  return (
    <View
      style={[styles.item, hidden && styles.hidden]}
      onTouchStart={(e) => setOrigin({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY })}
      // 위아래로 움직였을 때만 가져가서, 옆으로 미는 건 스크롤에 양보해요.
      onMoveShouldSetResponderCapture={(e) => {
        const dx = e.nativeEvent.pageX - origin.x;
        const dy = e.nativeEvent.pageY - origin.y;
        return !disabled && Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx) * 1.1;
      }}
      onResponderGrant={(e) => drag.start(node.id, ...page(e))}
      onResponderMove={(e) => drag.move(...page(e))}
      onResponderRelease={(e) => drag.end(...page(e))}
      onResponderTerminate={() => drag.cancel()}
      onResponderTerminationRequest={() => false}
    >
      <Pressable
        disabled={disabled}
        onPress={() => onSelect(selected ? null : node.id)}
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
          <JellyStar color="grey" size={TRAY_STAR} />
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {node.word}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { minWidth: 96, maxWidth: 130, alignItems: 'center' },
  hidden: { opacity: 0.15 },
  press: { alignItems: 'center', gap: 3, paddingVertical: 4 },
  pressed: { transform: [{ scale: 0.92 }] },
  lifted: { transform: [{ translateY: -4 }] },
  star: { width: TRAY_STAR, height: TRAY_STAR },
  name: {
    fontFamily: FONT.sansBold,
    fontSize: 13,
    lineHeight: 16,
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
