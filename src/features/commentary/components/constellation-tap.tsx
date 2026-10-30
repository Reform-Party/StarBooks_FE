import { type GestureResponderEvent, Pressable, StyleSheet } from 'react-native';

import { MIN_TOUCH, SCREEN } from '@/constants/layout';
import type { GraphEdge } from '@/features/commentary/api/types';
import { LINK_AREA, NODE_STAR, type Point } from '@/features/commentary/constants/board';
import { dist, distToSegment } from '@/features/commentary/utils/game-logic';

type Line = { edge: GraphEdge; a: Point; b: Point };

type Props = {
  stars: { id: number; at: Point }[];
  lines: Line[];
  onStar: (id: number) => void;
  onLine: (edge: GraphEdge) => void;
};

// 별을 누른 것으로 볼 거리 (별 반지름 + 여유)
const STAR_HIT = NODE_STAR / 2 + 8;
// 이 영역(바구니 4개 자리)만 덮어서 위쪽 메인 버튼은 가리지 않아요
const AREA = { left: SCREEN.safeX, top: LINK_AREA.top - 20, w: 756, h: LINK_AREA.h + 40 };

// 3단계 별자리 위의 터치 판정. 별 상자 · 이름표에 가려진 선 끝도 누를 수 있게,
// 누른 자리에서 가장 가까운 별(먼저) · 관계선을 거리로 골라요.
export default function ConstellationTap({ stars, lines, onStar, onLine }: Props) {
  const handlePress = (e: GestureResponderEvent) => {
    const p = { x: AREA.left + e.nativeEvent.locationX, y: AREA.top + e.nativeEvent.locationY };
    let star: { id: number; d: number } | null = null;
    for (const s of stars) {
      const d = dist(p, s.at);
      if (d <= STAR_HIT && (!star || d < star.d)) star = { id: s.id, d };
    }
    if (star) return onStar(star.id);
    let line: { edge: GraphEdge; d: number } | null = null;
    for (const l of lines) {
      const d = distToSegment(p, l.a, l.b);
      if (d <= MIN_TOUCH / 2 && (!line || d < line.d)) line = { edge: l.edge, d };
    }
    if (line) onLine(line.edge);
  };
  // 스크린 리더는 아래의 별 · 선 버튼(EdgeHit)을 따로 읽어요
  return <Pressable accessible={false} onPress={handlePress} style={styles.area} />;
}

const styles = StyleSheet.create({
  area: {
    position: 'absolute',
    left: AREA.left,
    top: AREA.top,
    width: AREA.w,
    height: AREA.h,
    zIndex: 4,
  },
});
