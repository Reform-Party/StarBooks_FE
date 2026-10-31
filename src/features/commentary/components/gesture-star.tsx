import { useEffect } from 'react';
import { type Animated as RNAnimated, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { GameNode } from '@/features/commentary/api/types';
import StarNode from '@/features/commentary/components/star-node';
import { type Area, HIT_R, NODE_STAR, type Point } from '@/features/commentary/constants/board';
import { MOTION } from '@/features/commentary/constants/motion';
import { type CanvasFrame, toDesign, useCanvas } from '@/features/commentary/hooks/use-canvas';
import { CATEGORY_COLOR, clampToBasket } from '@/features/commentary/utils/game-logic';
import { haptic } from '@/features/commentary/utils/haptics';

export type LineTarget = { id: number; x: number; y: number };

// 2단계 선 긋기. 선 끝은 UI 스레드에서 바로 그리고, 결과만 JS 로 알려요.
export type LineDrag = {
  frame: SharedValue<CanvasFrame>;
  from: SharedValue<number>; // 긋기 시작한 별 (-1: 없음)
  end: SharedValue<Point>;
  over: SharedValue<number>; // 손가락 아래 별 (-1: 없음)
  targets: SharedValue<LineTarget[]>;
  onOver: (id: number) => void;
  onRelease: (from: number, to: number) => void;
  onTap: (id: number) => void;
};

type Props = {
  node: GameNode;
  basket: number;
  area: Area;
  cx: number;
  cy: number;
  selected?: boolean;
  pop?: boolean;
  tint?: RNAnimated.Value;
  blocked?: boolean;
  line?: LineDrag;
  accessibilityLabel?: string;
  // 길게 눌러 옮긴 뒤 놓은 자리
  onMoved: (id: number, at: Point) => void;
};

const BOX_H = NODE_STAR + 36;

const nearest = (targets: LineTarget[], pt: Point, except: number) => {
  'worklet';
  let best = -1;
  let bestD = HIT_R;
  for (const t of targets) {
    if (t.id === except) continue;
    const d = Math.hypot(t.x - pt.x, t.y - pt.y);
    if (d < bestD) {
      best = t.id;
      bestD = d;
    }
  }
  return best;
};

// 바구니 안 별. 0.75초 길게 누르면(햅틱 + 1.1배 팝) 같은 바구니 안에서 옮길 수 있어요.
// line 이 있으면(2단계) 바로 끌어 관계 선을 긋고, 톡 누르면 고르기예요.
export default function GestureStar({
  node,
  basket,
  area,
  cx,
  cy,
  selected,
  pop,
  tint,
  blocked = false,
  line,
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
    .enabled(!blocked)
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
    // 길게 눌러 실제로 옮겼을 때만 알려요. onFinalize 는 톡 · 선 긋기로 이 제스처가 실패할 때도
    // 불려서, 거기서 알리면 2단계 진입 중 중간 좌표가 저장되고 매번 placement 가 바뀌어요.
    .onEnd(() => {
      if (px.value !== startX.value || py.value !== startY.value) {
        scheduleOnRN(onMoved, id, { x: px.value, y: py.value });
      }
    })
    .onFinalize(() => {
      lift.set(withTiming(1, { duration: MOTION.spring, easing: MOTION.springEase }));
    });

  const gesture = line
    ? Gesture.Exclusive(
        move,
        Gesture.Pan()
          .enabled(!blocked)
          // 두 손가락으로 두 별에서 동시에 그으면 먼저 시작한 선만 그려요.
          .onStart((e) => {
            if (line.from.value !== -1) return;
            line.from.set(id);
            line.end.set(toDesign(line.frame.value, e.absoluteX, e.absoluteY));
            line.over.set(-1);
          })
          .onUpdate((e) => {
            if (line.from.value !== id) return;
            const pt = toDesign(line.frame.value, e.absoluteX, e.absoluteY);
            const hit = nearest(line.targets.value, pt, id);
            const t = line.targets.value.find((v) => v.id === hit);
            line.end.set(t ? { x: t.x, y: t.y } : pt);
            if (hit !== line.over.value) {
              line.over.set(hit);
              scheduleOnRN(line.onOver, hit);
            }
          })
          .onEnd((_, success) => {
            if (line.from.value === id && success) {
              scheduleOnRN(line.onRelease, id, line.over.value);
            }
          })
          .onFinalize(() => {
            if (line.from.value !== id) return;
            line.from.set(-1);
            line.over.set(-1);
            scheduleOnRN(line.onOver, -1);
          }),
        Gesture.Tap()
          .enabled(!blocked)
          .runOnJS(true)
          .onEnd(() => line.onTap(id)),
      )
    : move;

  const box = useAnimatedStyle(() => ({
    transform: [
      { translateX: px.value - 50 },
      { translateY: py.value - NODE_STAR / 2 },
      { scale: lift.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.box, box]}>
        <StarNode
          color={CATEGORY_COLOR[node.category]}
          name={node.word}
          cx={50}
          cy={NODE_STAR / 2}
          selected={selected}
          pop={pop}
          tint={tint}
          accessibilityLabel={accessibilityLabel}
          onActivate={line && !blocked ? () => line.onTap(id) : undefined}
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  box: { position: 'absolute', left: 0, top: 0, width: 100, height: BOX_H, zIndex: 3 },
});
