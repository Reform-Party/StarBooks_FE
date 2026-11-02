import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { TWINKLE } from '@/constants/motion';
import type { NebulaPiece } from '@/features/settings/constants/nebula-pieces';
import {
  NEBULA_CENTER,
  NEBULA_DEPTH,
  NEBULA_TILT,
  type NebulaOrbit,
  RIGID_A,
  RIGID_E1,
  RIGID_E2,
} from '@/features/settings/utils/nebula-orbit';

const TILT = `${NEBULA_TILT}rad`;
const UNTILT = `${-NEBULA_TILT}rad`;

export type NebulaMotion = {
  turn: SharedValue<number>; // 모든 조각이 함께 돈 각도 (강체 회전)
  drift: SharedValue<number[]>; // 말할 때 조각(unit)마다 더 돌거나 덜 돈 각도
  levels: SharedValue<number[]>; // 조각마다 늦게 따라오는 목소리 크기 0–1
  level: SharedValue<number>; // 목소리 크기 0–1 (20ms 에 치솟고 80ms 에 꺼짐)
  activity: SharedValue<number>; // 0 쉬는 중 → 1 말하는 중
  clock: SharedValue<number>; // 반짝임 · 숨쉬기용 시계(ms)
};

type Props = {
  piece: NebulaPiece;
  index: number;
  orbit: NebulaOrbit;
  motion: NebulaMotion;
};

// UI 스레드(useAnimatedStyle)에서 부르므로 worklet 이어야 해요.
function lerp(a: number, b: number, t: number) {
  'worklet';
  return a + (b - a) * t;
}

// 성운 조각 하나. 미리 구운 PNG 를 transform · opacity 로만 움직여요.
// 앞뒤 순서(zIndex)는 움직이는 동안 바꾸지 않아요. 깊이는 크기와 투명도로 보여줘요.
export default function NebulaSprite({ piece, index, orbit: o, motion }: Props) {
  const { turn, drift, levels, level, activity, clock } = motion;
  // worklet 이 조각 데이터 전체를 들고 가지 않도록 필요한 값만 꺼내요.
  const { unit, opacity: baseOpacity, sharp } = piece;
  const isSpark = piece.kind === 'spark';
  const isCore = piece.kind === 'core';
  const minFace = piece.kind === 'halo' ? 0.85 : 0.5;
  const twinkleOffset = (index * 0.37) % 1;

  const animatedStyle = useAnimatedStyle(() => {
    const a = activity.get();
    const v = levels.get()[unit];
    const angle = turn.get() + drift.get()[unit];
    const t = clock.get();

    // 쉬는 중에는 모두 같은 축(강체 회전), 말하면 조각마다 틀어진 축으로 옮겨가요.
    const ax = lerp(RIGID_A[0], o.talkA[0], a);
    const ay = lerp(RIGID_A[1], o.talkA[1], a);
    const az = lerp(RIGID_A[2], o.talkA[2], a);
    const e1x = lerp(RIGID_E1[0], o.talkE1[0], a);
    const e1y = lerp(RIGID_E1[1], o.talkE1[1], a);
    const e1z = lerp(RIGID_E1[2], o.talkE1[2], a);
    const e2x = lerp(RIGID_E2[0], o.talkE2[0], a);
    const e2y = lerp(RIGID_E2[1], o.talkE2[1], a);
    const e2z = lerp(RIGID_E2[2], o.talkE2[2], a);

    // 목소리가 클수록 궤도가 벌어져요. (작은 조각은 크게, 큰 조각은 적게)
    const r = o.r + o.spread * v;
    const cos = Math.cos(o.theta + angle);
    const sin = Math.sin(o.theta + angle);
    const px = o.h * ax + r * (cos * e1x + sin * e2x);
    const py = o.h * ay + r * (cos * e1y + sin * e2y);
    const pz = o.h * az + r * (cos * e1z + sin * e2z);

    const sx = px * Math.cos(NEBULA_TILT) - py * Math.sin(NEBULA_TILT);
    const sy = px * Math.sin(NEBULA_TILT) + py * Math.cos(NEBULA_TILT);

    // Depth: 앞(z>0)은 최대 1.22배, 뒤로 갈수록 투명도 0.3 까지
    const depth = Math.min(1, Math.max(-1, pz / NEBULA_DEPTH));
    let scale = 1 + 0.22 * depth;
    let opacity = baseOpacity * (depth < 0 ? 1 + 0.7 * depth : 1);

    if (isSpark) scale *= 1 + 0.35 * v;
    if (sharp) {
      const twinkle = 0.5 - 0.5 * Math.cos(2 * Math.PI * (t / TWINKLE.duration + twinkleOffset));
      const calm = 1 - a;
      opacity *= lerp(1, lerp(TWINKLE.opacity[0], TWINKLE.opacity[1], twinkle) / 0.95, calm);
      scale *= lerp(1, lerp(TWINKLE.scale[0], TWINKLE.scale[1], twinkle), calm);
    }
    if (isCore) {
      // 가운데 빛 숨쉬기
      scale *= 1 + 0.06 * Math.sin((2 * Math.PI * t) / 2400) * a + 0.1 * level.get();
    }

    // 빛띠 · 헤일로 · 고리는 경선처럼 돌며 정면 → 옆면 → 반대편으로 넘어가요.
    // 헤일로는 성운 전체를 감싸는 광채라 덜 눌려서, 옆에서 봐도 구 모양이 유지돼요.
    const face = Math.cos(angle);
    // 뒷면도 거울상으로 뒤집지 않아요. 헤일로 · 빛띠는 기울어진 축 기준 대칭이 아니라, 뒤집으면 0 을 지날 때 색이 튀어요.
    const faceX = o.meridian ? Math.max(minFace, Math.abs(face)) : 1;

    return {
      opacity,
      transform: [
        { translateX: NEBULA_CENTER.x + sx - o.cx },
        { translateY: NEBULA_CENTER.y + sy - o.cy },
        { rotate: TILT },
        { scaleX: faceX },
        { rotate: UNTILT },
        { scale },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.sprite,
        {
          left: piece.cx - piece.w / 2,
          top: piece.cy - piece.h / 2,
          width: piece.w,
          height: piece.h,
        },
        animatedStyle,
      ]}
    >
      <Image source={piece.source} style={styles.image} contentFit="fill" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sprite: { position: 'absolute' },
  image: { width: '100%', height: '100%' },
});
