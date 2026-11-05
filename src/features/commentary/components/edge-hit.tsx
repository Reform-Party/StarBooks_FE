import { Pressable, StyleSheet } from 'react-native';

import { MIN_TOUCH } from '@/constants/layout';
import type { Point } from '@/features/commentary/constants/board';

type Props = { from: Point; to: Point; label: string; onPress: () => void };

const THICK = MIN_TOUCH; // 손가락으로 누르기 쉬운 두께 (44pt)

// 3단계 관계선의 스크린 리더용 버튼. 선 방향으로 돌려 놓아요.
// 손가락 터치는 위에 깔린 ConstellationTap 이 거리로 판정해서, 별에 가려진 선 끝도 눌러져요.
export default function EdgeHit({ from, to, label, onPress }: Props) {
  const len = Math.hypot(to.x - from.x, to.y - from.y);
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.hit,
        {
          left: mid.x - len / 2,
          top: mid.y - THICK / 2,
          width: len,
          transform: [{ rotate: `${angle}rad` }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  hit: { position: 'absolute', height: THICK, zIndex: 2 },
});
