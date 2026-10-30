import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { GameNode } from '@/features/commentary/api/types';
import StarNode from '@/features/commentary/components/star-node';
import { type Area, NODE_STAR, type Point } from '@/features/commentary/constants/board';
import { MOTION } from '@/features/commentary/constants/motion';
import { useCanvas } from '@/features/commentary/hooks/use-canvas';
import { CATEGORY_COLOR, clampToBasket } from '@/features/commentary/utils/game-logic';
import { haptic } from '@/features/commentary/utils/haptics';

type Props = {
  node: GameNode;
  basket: number;
  area: Area;
  cx: number;
  cy: number;
  pop?: boolean;
  accessibilityLabel?: string;
  // 길게 눌러 옮긴 뒤 놓은 자리
  onMoved: (id: number, at: Point) => void;
};

const BOX_H = NODE_STAR + 36;

// 바구니 안 별. 0.75초 길게 누르면(햅틱 + 1.1배 팝) 같은 바구니 안에서 옮길 수 있어요.
export default function GestureStar({
  node,
  basket,
  area,
  cx,
  cy,
  pop,
  accessibilityLabel,
  onMoved,
}: Props) {
  const id = node.id;
  const { frame } = useCanvas();
  const px = useSharedValue(cx);
  const py = useSharedValue(cy);
  const startX = useSharedValue(cx);
  const startY = useSharedValue(cy);
  const lift = useSharedValue(1);

  // 자리가 바뀌면(2단계 진입 · 영역 크기 변화) 미끄러지듯 옮겨요. 손으로 옮긴 뒤에는 이미 같은 자리라 그대로예요.
  useEffect(() => {
    const opts = { duration: MOTION.trayHide };
    px.set(withTiming(cx, opts));
    py.set(withTiming(cy, opts));
  }, [cx, cy, px, py]);

  const move = Gesture.Pan()
    .activateAfterLongPress(MOTION.longPress)
    .onStart(() => {
      startX.set(px.value);
      startY.set(py.value);
      lift.set(
        withTiming(MOTION.liftScale, { duration: MOTION.spring, easing: MOTION.springEase }),
      );
      scheduleOnRN(haptic, 'longPress');
    })
    .onUpdate((e) => {
      const s = frame.value.scale;
      const p = clampToBasket(
        { x: startX.value + e.translationX / s, y: startY.value + e.translationY / s },
        basket,
        area,
      );
      px.set(p.x);
      py.set(p.y);
    })
    // 길게 눌러 실제로 옮겼을 때만 알려요. onFinalize 는 그냥 톡 누른(활성화 안 된) 경우에도
    // 불려서, 거기서 알리면 같은 자리로 placement 가 다시 바뀌어요.
    .onEnd(() => {
      if (px.value !== startX.value || py.value !== startY.value) {
        scheduleOnRN(onMoved, id, { x: px.value, y: py.value });
      }
    })
    .onFinalize(() => {
      lift.set(withTiming(1, { duration: MOTION.spring, easing: MOTION.springEase }));
    });

  const box = useAnimatedStyle(() => ({
    transform: [
      { translateX: px.value - 50 },
      { translateY: py.value - NODE_STAR / 2 },
      { scale: lift.value },
    ],
  }));

  return (
    <GestureDetector gesture={move}>
      <Animated.View style={[styles.box, box]}>
        <StarNode
          color={CATEGORY_COLOR[node.category]}
          name={node.word}
          cx={50}
          cy={NODE_STAR / 2}
          pop={pop}
          accessibilityLabel={accessibilityLabel}
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  box: { position: 'absolute', left: 0, top: 0, width: 100, height: BOX_H, zIndex: 3 },
});
