import { Pressable, StyleSheet, View } from 'react-native';

import type { Category } from '@/features/commentary/api/types';
import JellyLabel from '@/features/commentary/components/jelly-label';
import JellyStar from '@/components/ui/jelly-star';
import { type Area, BASKET_W, basketX } from '@/features/commentary/constants/board';
import { GLASS, STAR, withAlpha } from '@/constants/colors';
import { CATEGORY_COLOR } from '@/features/commentary/utils/game-logic';

type Props = {
  categories: Category[];
  area: Area;
  // 탭으로 고른 별이 있을 때 바구니를 눌러 넣기
  armed?: boolean;
  // 끌고 있는 별 아래 바구니
  hot?: number;
  onBasketPress?: (index: number) => void;
};

// 바구니 4개(등장인물 · 장소 · 사건 · 교훈). 별 노드는 각 단계에서 따로 그려요.
export default function Baskets({
  categories,
  area,
  armed = false,
  hot = -1,
  onBasketPress,
}: Props) {
  return categories.map((cat, i) => {
    const color = CATEGORY_COLOR[cat];
    const c = STAR[color];
    const frame = {
      backgroundColor:
        hot === i
          ? withAlpha(c.c300, 0.14)
          : armed
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(255,255,255,0.05)',
      borderColor: hot === i ? c.rim : withAlpha(c.rim, armed ? 0.7 : 0.4),
      borderWidth: hot === i ? 2 : 1,
    };
    return (
      <View
        key={cat}
        style={[
          styles.basket,
          { left: basketX(i), top: area.top, width: BASKET_W, height: area.h },
          frame,
        ]}
      >
        <Pressable
          disabled={!armed}
          onPress={() => onBasketPress?.(i)}
          accessibilityRole={armed ? 'button' : undefined}
          accessibilityLabel={`${cat} 바구니`}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.header} pointerEvents="none">
          <JellyLabel tone={color}>
            <JellyStar color={color} size={15} />
            {cat}
          </JellyLabel>
        </View>
      </View>
    );
  });
}

const styles = StyleSheet.create({
  basket: { position: 'absolute', borderRadius: 18, borderWidth: 1, borderColor: GLASS.line },
  header: { position: 'absolute', top: -14, left: 0, right: 0, alignItems: 'center' },
});
