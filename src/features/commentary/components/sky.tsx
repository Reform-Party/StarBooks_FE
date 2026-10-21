import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import Twinkle from '@/features/commentary/components/twinkle';
import { H, W } from '@/features/commentary/constants/layout';
import { MILKY_WAY, SKY } from '@/features/commentary/constants/theme';
import { useReduceMotion } from '@/features/commentary/hooks/use-motion';

type Props = { dim?: boolean };

// 밤하늘 배경 (디자인 sky()). 공용 배경 컴포넌트가 생기면 그걸로 바꿔 끼워도 돼요.
const TWINKLES: [number, number, string][] = [
  [105, 37, '#fde047'],
  [61, 109, '#5ce1e6'],
  [79, 190, '#f472b6'],
  [96, 270, '#c084fc'],
  [192, 334, '#fef08a'],
  [245, 29, '#a5f3fc'],
  [437, 21, '#f472b6'],
  [420, 355, '#c084fc'],
  [778, 33, '#e879f9'],
  [804, 117, '#fde047'],
  [778, 206, '#5ce1e6'],
  [795, 286, '#fbcfe8'],
  [673, 338, '#c084fc'],
  [105, 97, '#fef08a'],
  [559, 64, '#a5f3fc'],
  [297, 245, '#fde047'],
];
const MILKY_WAY_BANDS: [string, string, number][] = [
  ['M 770,-10 Q 720,620 280,1010 L 520,1010 Q 820,580 820,-10 Z', 'url(#sky-mw-outer)', 0.45],
  ['M 780,-10 Q 710,610 300,1000 L 500,1000 Q 805,570 815,-10 Z', 'url(#sky-mw)', 0.5],
  ['M 790,-10 Q 700,600 350,1000 L 450,1000 Q 790,570 805,-10 Z', 'url(#sky-mw-core)', 0.55],
];
const AURORA: [number, number, number, string, number][] = [
  [440, 20, 100, '147,51,234', 0.16],
  [35, 235, 85, '20,184,166', 0.14],
  [790, 370, 90, '245,158,11', 0.14],
  [685, 165, 95, '236,72,153', 0.12],
];
const DUST: [number, number, number][] = [
  [690, 36, 1.2],
  [645, 120, 1.4],
  [555, 220, 1.4],
  [424, 320, 1.4],
];

function Sky({ dim = false }: Props) {
  const still = useReduceMotion();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={W} height={H}>
        <Defs>
          <RadialGradient
            id="sky-bg"
            cx={W / 2}
            cy={H * 0.2}
            r={560}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={SKY.top} />
            <Stop offset="0.45" stopColor={SKY.mid} />
            <Stop offset="1" stopColor={SKY.deep} />
          </RadialGradient>
          {AURORA.map(([, , , rgb, a], i) => (
            <RadialGradient key={i} id={`sky-au${i}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={`rgb(${rgb})`} stopOpacity={a * 1.6} />
              <Stop offset="1" stopColor={`rgb(${rgb})`} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        <Rect width={W} height={H} fill="url(#sky-bg)" />
        {AURORA.map(([x, y, r], i) => (
          <Circle key={i} cx={x} cy={y} r={r * 1.4} fill={`url(#sky-au${i})`} />
        ))}
      </Svg>
      {/* 은하수 띠: RN 에는 blur 필터가 없어서 굵은 반투명 테두리를 겹쳐 번짐을 흉내 내요. */}
      <Svg
        width={W}
        height={H}
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
        opacity={dim ? 0.45 : 0.75}
      >
        <Defs>
          <LinearGradient id="sky-mw-outer" x1="0.8" y1="0" x2="0.4" y2="1">
            <Stop offset="0" stopColor={MILKY_WAY[0]} stopOpacity={0.2} />
            <Stop offset="0.5" stopColor={MILKY_WAY[2]} stopOpacity={0.18} />
            <Stop offset="1" stopColor={MILKY_WAY[4]} stopOpacity={0.2} />
          </LinearGradient>
          <LinearGradient id="sky-mw" x1="0.8" y1="0" x2="0.4" y2="1">
            <Stop offset="0" stopColor={MILKY_WAY[0]} stopOpacity={0.65} />
            <Stop offset="0.3" stopColor={MILKY_WAY[1]} stopOpacity={0.6} />
            <Stop offset="0.6" stopColor={MILKY_WAY[2]} stopOpacity={0.55} />
            <Stop offset="0.85" stopColor={MILKY_WAY[3]} stopOpacity={0.6} />
            <Stop offset="1" stopColor={MILKY_WAY[4]} stopOpacity={0.75} />
          </LinearGradient>
          <LinearGradient id="sky-mw-core" x1="0.8" y1="0" x2="0.4" y2="1">
            <Stop offset="0" stopColor="#a5f3fc" stopOpacity={0.75} />
            <Stop offset="0.35" stopColor="#c4b5fd" stopOpacity={0.7} />
            <Stop offset="0.7" stopColor="#fbcfe8" stopOpacity={0.65} />
            <Stop offset="1" stopColor="#fef08a" stopOpacity={0.85} />
          </LinearGradient>
        </Defs>
        {MILKY_WAY_BANDS.map(([d, fill, op], k) => (
          <G key={k} opacity={op}>
            <Path d={d} fill="none" stroke={fill} strokeWidth={70} strokeOpacity={0.12} />
            <Path d={d} fill="none" stroke={fill} strokeWidth={30} strokeOpacity={0.25} />
            <Path d={d} fill={fill} />
          </G>
        ))}
      </Svg>
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        {DUST.map(([x, y, r], i) => (
          <Circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={0.8} />
        ))}
      </Svg>
      {TWINKLES.map(([x, y, c], i) => (
        // 한꺼번에 깜빡이지 않게 조금씩 늦춰 시작해요
        <Twinkle key={i} x={x} y={y} color={c} delay={(i * 190) % 3000} still={still} />
      ))}
    </View>
  );
}

export default memo(Sky);
