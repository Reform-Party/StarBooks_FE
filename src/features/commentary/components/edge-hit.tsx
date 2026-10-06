import { Pressable, StyleSheet } from 'react-native';

import type { Point } from '@/features/commentary/constants/layout';

type Props = { from: Point; to: Point; label: string; onPress: () => void };

const THICK = 32; // 손가락으로 누르기 쉬운 두께

// 3단계 관계선 위에 깔리는 투명 터치 영역. 선 방향으로 돌려 놓아서 선 어디를 눌러도 돼요.
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
