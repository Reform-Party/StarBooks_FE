import { useIsFocused } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import Chip from '@/components/ui/chip';
import JellyStar from '@/components/ui/jelly-star';
import { STAR, type StarColor } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import {
  CONSTELLATION_LAYOUT,
  type ConstellationStar,
} from '@/features/make/constants/constellation';
import { labelColor } from '@/features/make/constants/label-color';

// 세 별의 궤도: 장반경 · 단반경 · 기울기(rad) · 시작 각도
const ORBITS = [
  { rx: 230, ry: 70, tilt: -0.2, start: 0 },
  { rx: 190, ry: 95, tilt: 0.45, start: 2.1 },
  { rx: 250, ry: 55, tilt: 1.1, start: 4.2 },
];

const ORBIT_MS = 2400; // 수렴
const FLASH_MS = 200; // 충돌 플래시
const FORM_MS = 700; // 별자리 펼쳐짐
const FORM_START = ORBIT_MS + FLASH_MS;
const BASE_OMEGA = 1.6; // 시작 각속도 (rad/s)
const TURN_S = 40; // 한 바퀴 40s

const EDGES = [
  [0, 1],
  [1, 2],
  [2, 0],
] as const;

const NODE_W = 160;
const CHIP_H = 20;
const STAR_SIZE = 46;
const GAP = 4;

const clamp01 = (v: number) => {
  'worklet';
  return Math.min(1, Math.max(0, v));
};

const easeOutBack = (t: number) => {
  'worklet';
  return 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
};

const orbitScale = (t: number) => {
  'worklet';
  return Math.max(0.04, 1 - Math.pow(t / ORBIT_MS, 1.15));
};

// 완성된 별자리를 화면 세로축 둘레로 돌린 위치 (회전목마처럼 돌아서 이름표가 늘 똑바로 서요)
const project = (i: number, t: number) => {
  'worklet';
  const pt = CONSTELLATION_LAYOUT[i];
  const since = t - FORM_START;
  const k = easeOutBack(clamp01(since / FORM_MS));
  const theta = ((Math.max(0, since) / 1000) * 2 * Math.PI) / TURN_S;
  const x = pt.x * k;
  const z = pt.z * k;
  return {
    x: x * Math.cos(theta) + z * Math.sin(theta),
    y: pt.y * k,
    depth: -x * Math.sin(theta) + z * Math.cos(theta),
  };
};

type Props = {
  stars: readonly ConstellationStar[];
  // 별자리가 다 펼쳐지면 한 번 불려요.
  onFormed?: () => void;
};

// 별자리 확인 (Figma design · 명세 1.1.1)
//  세 별이 서로 다른 타원 궤도로 돎 → 타원이 점점 줄어듦(선속도 일정 → 점점 빨라짐) → 하나로 겹쳐 충돌(플래시 0.2s)
//  → 별자리 생성 → 화면 세로축으로 천천히 회전 (수렴 약 2.4s · 이후 40s 에 한 바퀴)
// 동작 줄이기를 켜 두면 바로 완성된 모습으로 멈춰 있어요. (그때 onFormed 는 불리지 않아요)
// 다른 화면에 가려지면(만드는 중 · 동화 프레임 아래) 프레임 갱신을 멈춰요.
export default function Constellation({ stars, onFormed }: Props) {
  const reduced = useReducedMotion();
  const focused = useIsFocused();
  const elapsed = useSharedValue(reduced ? FORM_START + FORM_MS : 0);
  const angles = useSharedValue(ORBITS.map((o) => o.start));
  const notified = useSharedValue(false);

  // 두 번째 인자는 첫 렌더에만 읽혀서, 켜고 끄기는 setActive 로 해요.
  const frame = useFrameCallback((f) => {
    const dt = Math.min(50, f.timeSincePreviousFrame ?? 16);
    const t = elapsed.get() + dt;
    elapsed.set(t);
    if (t < ORBIT_MS) {
      // 타원 크기 s 가 줄어도 선속도는 그대로 → 각속도 = ω0 / s
      const w = (BASE_OMEGA / orbitScale(t)) * (dt / 1000);
      angles.set(angles.get().map((a, i) => a + w * (i % 2 ? -1 : 1)));
    }
    if (!notified.get() && t >= FORM_START + FORM_MS) {
      notified.set(true);
      if (onFormed) scheduleOnRN(onFormed);
    }
  }, false);

  useEffect(() => {
    frame.setActive(!reduced && focused);
  }, [frame, reduced, focused]);

  return (
    <View style={styles.root} pointerEvents="none" accessible={false}>
      {ORBITS.map((_, i) => (
        <OrbitStar key={i} index={i} tone={stars[i].tone} elapsed={elapsed} angles={angles} />
      ))}
      <Flash elapsed={elapsed} />
      <Svg width={600} height={300} viewBox="-300 -150 600 300" style={styles.lines}>
        {EDGES.map(([a, b]) => (
          <EdgeLine key={`${a}-${b}`} from={a} to={b} elapsed={elapsed} />
        ))}
      </Svg>
      {stars.map((s, i) => (
        <FormedStar key={s.label} index={i} star={s} elapsed={elapsed} />
      ))}
    </View>
  );
}

type Timing = { elapsed: SharedValue<number> };

function OrbitStar({
  index,
  tone,
  elapsed,
  angles,
}: Timing & { index: number; tone: StarColor; angles: SharedValue<number[]> }) {
  const style = useAnimatedStyle(() => {
    const t = elapsed.get();
    if (t >= ORBIT_MS) return { opacity: 0 };
    const o = ORBITS[index];
    const s = orbitScale(t);
    const a = angles.get()[index];
    const ex = o.rx * s * Math.cos(a);
    const ey = o.ry * s * Math.sin(a);
    return {
      opacity: 1,
      transform: [
        { translateX: ex * Math.cos(o.tilt) - ey * Math.sin(o.tilt) },
        { translateY: ex * Math.sin(o.tilt) + ey * Math.cos(o.tilt) },
      ],
    };
  });
  return (
    <Animated.View style={[styles.orbit, style]}>
      <JellyStar color={tone} size={32} />
    </Animated.View>
  );
}

function Flash({ elapsed }: Timing) {
  const style = useAnimatedStyle(() => {
    const p = (elapsed.get() - ORBIT_MS) / FLASH_MS;
    if (p < 0 || p > 1) return { opacity: 0 };
    return { opacity: 1 - p, transform: [{ scale: 0.4 + p * 2.6 }] };
  });
  return <Animated.View style={[styles.flash, style]} />;
}

const AnimatedLine = Animated.createAnimatedComponent(Line);

function EdgeLine({ from, to, elapsed }: Timing & { from: number; to: number }) {
  const props = useAnimatedProps(() => {
    const t = elapsed.get();
    const a = project(from, t);
    const b = project(to, t);
    // 별자리가 펼쳐지는 동안 선 끝을 a → b 로 늘려 그려요.
    const p = clamp01((t - FORM_START) / FORM_MS);
    return {
      x1: a.x,
      y1: a.y,
      x2: a.x + (b.x - a.x) * p,
      y2: a.y + (b.y - a.y) * p,
      strokeOpacity: t < FORM_START ? 0 : 0.55,
    };
  });
  return (
    <AnimatedLine
      animatedProps={props}
      stroke={STAR.purple.c300}
      strokeWidth={3}
      strokeLinecap="round"
    />
  );
}

// 세 별 중 몇 번째로 앞에 있는지 (0~2). 깊이 값 대신 순위만 쓰면 별이 교차할 때만 zIndex 가 바뀌어
// shadow tree 커밋이 줄어요.
const depthRank = (index: number, t: number) => {
  'worklet';
  const mine = project(index, t).depth;
  let rank = 0;
  for (let i = 0; i < CONSTELLATION_LAYOUT.length; i++) {
    if (i !== index && project(i, t).depth < mine) rank++;
  }
  return rank;
};

function FormedStar({ index, star, elapsed }: Timing & { index: number; star: ConstellationStar }) {
  const style = useAnimatedStyle(() => {
    const t = elapsed.get();
    if (t < FORM_START) return { opacity: 0 };
    const { x, y, depth } = project(index, t);
    return {
      opacity: 1,
      zIndex: depthRank(index, t),
      transform: [{ translateX: x }, { translateY: y }, { scale: 1 + depth / 500 }],
    };
  });
  return (
    <Animated.View style={[styles.anchor, style]}>
      <View style={styles.node}>
        <Chip label={star.label} tone={star.tone} size="sm" />
        <JellyStar color={star.tone} size={STAR_SIZE} />
        <Text numberOfLines={1} style={[styles.value, { color: labelColor(star.tone) }]}>
          {star.value}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // 별자리 중심 = 화면 (437, 184)
  root: { position: 'absolute', left: 437, top: 184, width: 0, height: 0 },
  orbit: { position: 'absolute', left: -16, top: -16 },
  flash: {
    position: 'absolute',
    left: -60,
    top: -60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: STAR.yellow.rim,
    shadowColor: '#FFFFFF',
    shadowOpacity: 1,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  lines: { position: 'absolute', left: -300, top: -150 },
  anchor: { position: 'absolute', left: 0, top: 0, width: 0, height: 0 },
  // 별 중심이 기준점에 오도록 칩은 위, 이름은 아래에 매달아요.
  node: {
    position: 'absolute',
    left: -NODE_W / 2,
    top: -(CHIP_H + GAP + STAR_SIZE / 2),
    width: NODE_W,
    alignItems: 'center',
    gap: GAP,
  },
  value: {
    includeFontPadding: false,
    fontFamily: FONT.pop,
    fontSize: 17,
    textShadowColor: 'rgba(7,9,20,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
