import { Animated, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import JellyStar from '@/components/ui/jelly-star';
import { INK, type StarColor } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import Text from '@/features/commentary/components/app-text';
import { NODE_STAR } from '@/features/commentary/constants/board';
import { WRONG_TINT } from '@/features/commentary/constants/palette';
import { usePop } from '@/features/commentary/hooks/use-motion';

type Props = {
  color: StarColor;
  name: string;
  cx: number;
  cy: number;
  size?: number;
  pop?: boolean;
  // 0 → 1 → 0 으로 움직이면 별이 잠깐 붉어져요 (오답)
  tint?: Animated.Value;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

// 이야기 별 = 젤리 별 + 아래 이름. (cx, cy) 는 별의 한가운데. 긴 이름은 두 줄로 넘어가요.
// 누를 수 없는 별이라 스크린 리더에는 버튼이 아니라 이름으로만 읽혀요.
export default function StarNode({
  color,
  name,
  cx,
  cy,
  size = NODE_STAR,
  pop = false,
  tint,
  style,
  accessibilityLabel,
}: Props) {
  const popStyle = usePop();
  return (
    <Animated.View
      accessible
      accessibilityLabel={accessibilityLabel ?? name}
      style={[styles.node, { left: cx - 50, top: cy - size / 2 }, pop && popStyle, style]}
    >
      <View style={{ width: size, height: size }}>
        <JellyStar color={color} size={size} glow />
        {tint ? (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: tint }]}>
            <JellyStar size={size} tint={WRONG_TINT} />
          </Animated.View>
        ) : null}
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  node: { position: 'absolute', width: 100, alignItems: 'center', gap: 2 },
  name: {
    maxWidth: 130,
    fontFamily: FONT.sansBold,
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: -0.26,
    color: INK[1],
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
