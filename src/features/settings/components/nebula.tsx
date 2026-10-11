import { useEffect } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import {
  type SharedValue,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';

import NebulaSprite, { type NebulaMotion } from '@/features/settings/components/nebula-sprite';
import {
  NEBULA_BOX,
  NEBULA_PIECES,
  type NebulaKind,
} from '@/features/settings/constants/nebula-pieces';
import { NEBULA_ORBITS } from '@/features/settings/utils/nebula-orbit';

// idle: 기울어진 축으로 30초에 한 바퀴 도는 구
// talk: 같은 크기 목소리를 가정하고 조각마다 제각각 공전 (회전 4배)
// live: 실제 목소리 크기(level)에 맞춰 튀어요 (회전 1.5배 + 큰 음절 최대 7배)
export type NebulaMode = 'idle' | 'talk' | 'live';

const MODE_CODE: Record<NebulaMode, number> = { idle: 0, talk: 1, live: 2 };
const TURN_PER_MS = (2 * Math.PI) / 30000;
const ATTACK_MS = 20;
const RELEASE_MS = 80;
// 말하기가 끝나면 조각마다 벌어진 각도가 쉬는 모양으로 돌아와요. (시간상수: 1.5초에 63%, 4.5초에 95%)
const SETTLE_MS = 1500;

// 그리는 순서: 헤일로 → 빛띠 → 가운데 빛 → 고리 → 알갱이.
// 알갱이를 맨 위에 둬야 안쪽으로 뭉쳐도 가운데 빛에 묻히지 않아요. 뒤쪽 알갱이는 투명도로 흐려져요.
const LAYER: Record<NebulaKind, number> = { halo: 0, arm: 1, core: 2, ring: 3, spark: 4 };
const SPRITES = NEBULA_PIECES.map((piece, index) => ({ piece, index })).sort(
  (a, b) => LAYER[a.piece.kind] - LAYER[b.piece.kind],
);

type Props = {
  mode: NebulaMode;
  // live 모드에서 쓰는 목소리 크기 0–1. 녹음 쪽에서 dB 를 바꿔 넣어 줘요.
  level?: SharedValue<number>;
  style?: StyleProp<ViewStyle>;
};

// 목소리 등록 모달 가운데의 샛별 성운 (Figma Nebula / 샛별 성운 · 196 × 196)
export default function Nebula({ mode, level, style }: Props) {
  const reduceMotion = useReducedMotion();
  const modeCode = useSharedValue(MODE_CODE[mode]);
  const motion: NebulaMotion = {
    turn: useSharedValue(0),
    drift: useSharedValue(NEBULA_ORBITS.map(() => 0)),
    levels: useSharedValue(NEBULA_ORBITS.map(() => 0)),
    level: useSharedValue(0),
    activity: useSharedValue(0),
    clock: useSharedValue(0),
  };
  const speed = useSharedValue(1);

  useEffect(() => {
    modeCode.set(MODE_CODE[mode]);
  }, [mode, modeCode]);

  useFrameCallback(({ timeSincePreviousFrame }) => {
    const dt = Math.min(timeSincePreviousFrame ?? 16, 64);
    const follow = (current: number, target: number, ms: number) =>
      current + (target - current) * (1 - Math.exp(-dt / ms));

    const code = modeCode.get();
    const input = code === 0 ? 0 : code === 1 ? 1 : Math.min(1, Math.max(0, level?.get() ?? 0));
    const prev = motion.level.get();
    const next = follow(prev, input, input > prev ? ATTACK_MS : RELEASE_MS);
    motion.level.set(next);

    const activity = follow(motion.activity.get(), code === 0 ? 0 : 1, 250);
    motion.activity.set(activity);

    const targetSpeed = code === 0 ? 1 : code === 1 ? 4 : 1.5 + 5.5 * next;
    const currentSpeed = follow(speed.get(), targetSpeed, 120);
    speed.set(currentSpeed);

    motion.levels.modify((values) => {
      'worklet';
      for (let i = 0; i < values.length; i += 1) {
        values[i] += (next - values[i]) * (1 - Math.exp(-dt / NEBULA_ORBITS[i].lag));
      }
      return values;
    });

    // 동작 줄이기가 켜져 있으면 반복 움직임(회전 · 반짝임)을 멈춰요.
    if (reduceMotion) return;
    motion.clock.set(motion.clock.get() + dt);
    const step = TURN_PER_MS * currentSpeed * dt;
    motion.turn.set(motion.turn.get() + step);
    const settle = (1 - activity) * (1 - Math.exp(-dt / SETTLE_MS));
    motion.drift.modify((values) => {
      'worklet';
      for (let i = 0; i < values.length; i += 1) {
        // 말하는 동안: 조각마다 1.3–2.7배(일부 반대 방향)로 돌아 각도가 벌어져요.
        values[i] += step * (NEBULA_ORBITS[i].speed - 1) * activity;
        // 쉬는 동안: 가장 가까운 한 바퀴 지점으로 모여서 처음 모양(Rest pack)으로 돌아와요.
        const offset = values[i] - 2 * Math.PI * Math.round(values[i] / (2 * Math.PI));
        values[i] -= offset * settle;
      }
      return values;
    });
  });

  return (
    <View style={[styles.box, style]} pointerEvents="none">
      {SPRITES.map(({ piece, index }) => (
        <NebulaSprite
          key={index}
          piece={piece}
          index={index}
          orbit={NEBULA_ORBITS[piece.unit]}
          motion={motion}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: NEBULA_BOX, height: NEBULA_BOX },
});
