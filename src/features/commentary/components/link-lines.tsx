import { memo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Stop } from 'react-native-svg';

import { H, type Point, W } from '@/features/commentary/constants/layout';
import { STAR } from '@/features/commentary/constants/theme';

type Segment = [Point, Point];

type Props = {
  segments: Segment[];
  // 퀴즈를 푸는 중인 선
  pending?: Segment | null;
  // 손가락으로 긋는 중인 선
  drag?: Segment | null;
};

// 이어진 관계선(은하수 그라데이션 + 은은한 빛) · 긋는 중인 노란 점선
function LinkLines({ segments, pending, drag }: Props) {
  return (
    <Svg width={W} height={H} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id="link-way" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={W} y2="0">
          <Stop offset="0" stopColor="#5CE1E6" />
          <Stop offset="0.5" stopColor="#C084FC" />
          <Stop offset="1" stopColor="#FDE047" />
        </LinearGradient>
      </Defs>
      <G strokeLinecap="round">
        {segments.map(([a, b]) => (
          <G key={`${a.x},${a.y}-${b.x},${b.y}`}>
            <Line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="url(#link-way)"
              strokeWidth={10}
              opacity={0.18}
            />
            <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="url(#link-way)" strokeWidth={3} />
          </G>
        ))}
        {pending ? (
          <Line
            x1={pending[0].x}
            y1={pending[0].y}
            x2={pending[1].x}
            y2={pending[1].y}
            stroke={STAR.yellow.c300}
            strokeWidth={3}
            strokeDasharray="6 7"
          />
        ) : null}
        {drag ? (
          <>
            <Line
              x1={drag[0].x}
              y1={drag[0].y}
              x2={drag[1].x}
              y2={drag[1].y}
              stroke={STAR.yellow.c300}
              strokeWidth={3}
              strokeDasharray="6 7"
            />
            <Circle
              cx={drag[1].x}
              cy={drag[1].y}
              r={9}
              fill="rgba(253,224,71,0.35)"
              stroke={STAR.yellow.c300}
              strokeWidth={2}
            />
          </>
        ) : null}
      </G>
    </Svg>
  );
}

export default memo(LinkLines);
