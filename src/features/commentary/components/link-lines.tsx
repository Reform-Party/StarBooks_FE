import { memo } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Stop } from 'react-native-svg';

import DrawnLine from '@/features/commentary/components/drawn-line';
import { H, type Point, W } from '@/features/commentary/constants/layout';
import { MILKY_WAY, STAR } from '@/features/commentary/constants/theme';

type Segment = [Point, Point];

export type LinkSegment = { key: string; a: Point; b: Point; fresh?: boolean };

type Props = {
  segments: LinkSegment[];
  // 퀴즈를 푸는 중인 선
  pending?: Segment | null;
  // 틀린 관계: 붉은 선이 0.3s 동안 사라져요
  wrong?: { seg: Segment; opacity: Animated.Value } | null;
};

const STOPS = MILKY_WAY.map((c, i) => ({ c, at: i / (MILKY_WAY.length - 1) }));

// 이어진 관계선(은하수 그라데이션 + 은은한 빛) · 퀴즈 중인 노란 점선 · 틀린 관계 붉은 선
function LinkLines({ segments, pending, wrong }: Props) {
  return (
    <>
      <Svg width={W} height={H} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id="link-way" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={W} y2="0">
            {STOPS.map((s) => (
              <Stop key={s.c} offset={s.at} stopColor={s.c} />
            ))}
          </LinearGradient>
        </Defs>
        {segments.map((s) => (
          <DrawnLine key={s.key} a={s.a} b={s.b} stroke="url(#link-way)" animate={s.fresh} />
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
            strokeLinecap="round"
          />
        ) : null}
      </Svg>
      {wrong ? (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { opacity: wrong.opacity }]}
        >
          <Svg width={W} height={H}>
            <Line
              x1={wrong.seg[0].x}
              y1={wrong.seg[0].y}
              x2={wrong.seg[1].x}
              y2={wrong.seg[1].y}
              stroke="#F87171"
              strokeWidth={3}
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>
      ) : null}
    </>
  );
}

export default memo(LinkLines);
