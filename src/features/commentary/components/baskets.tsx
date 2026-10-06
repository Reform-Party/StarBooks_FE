import { Pressable, StyleSheet, View } from 'react-native';

import type { Category } from '@/features/commentary/api/types';
import JellyButton from '@/features/commentary/components/jelly-button';
import JellyStar from '@/features/commentary/components/jelly-star';
import { type Area, BASKET_W, basketX } from '@/features/commentary/constants/layout';
import { GLASS, STAR } from '@/features/commentary/constants/theme';
import { CATEGORY_COLOR } from '@/features/commentary/utils/game-logic';

const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

type Props = {
  categories: Category[];
  area: Area;
  // 3단계처럼 틀만 숨기기
  hide?: boolean;
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
  hide = false,
  armed = false,
  hot = -1,
  onBasketPress,
}: Props) {
  return categories.map((cat, i) => {
    const color = CATEGORY_COLOR[cat];
    const c = STAR[color];
    const frame = hide
      ? styles.hidden
      : {
          backgroundColor:
            hot === i
              ? alpha(c.c300, 0.14)
              : armed
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(255,255,255,0.05)',
          borderColor: hot === i ? c.rim : alpha(c.rim, armed ? 0.7 : 0.4),
          borderWidth: hot === i ? 2 : 1,
        };
    return (
      <Pressable
        key={cat}
        disabled={!armed}
        onPress={() => onBasketPress?.(i)}
        accessibilityRole={armed ? 'button' : undefined}
        accessibilityLabel={`${cat} 바구니`}
        style={[
          styles.basket,
          { left: basketX(i), top: area.top, width: BASKET_W, height: area.h },
          frame,
        ]}
      >
        {hide ? null : (
          <View style={styles.header} pointerEvents="none">
            <JellyButton tone={color} height={26} font="sans" fontSize={14.5} style={styles.label}>
              <JellyStar color={color} size={15} glow={false} />
              {cat}
            </JellyButton>
          </View>
        )}
      </Pressable>
    );
  });
}

const styles = StyleSheet.create({
  basket: { position: 'absolute', borderRadius: 18, borderWidth: 1, borderColor: GLASS.line },
  hidden: { backgroundColor: 'transparent', borderColor: 'transparent' },
  header: { position: 'absolute', top: -14, left: 0, right: 0, alignItems: 'center' },
  label: { paddingHorizontal: 11, gap: 4 },
});
