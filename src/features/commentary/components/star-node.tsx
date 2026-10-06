import {
  Animated,
  type GestureResponderHandlers,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import JellyStar from '@/features/commentary/components/jelly-star';
import { NODE_STAR } from '@/features/commentary/constants/layout';
import { FONT, INK, STAR, type StarColor } from '@/features/commentary/constants/theme';
import { usePop, usePulse } from '@/features/commentary/hooks/use-motion';

type Props = {
  color: StarColor | 'grey';
  name: string;
  cx: number;
  cy: number;
  size?: number;
  selected?: boolean;
  pop?: boolean;
  panHandlers?: GestureResponderHandlers;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  onAccessibilityTap?: () => void;
};

// 이야기 별 = 젤리 별 + 아래 이름. (cx, cy) 는 별의 한가운데. 긴 이름은 두 줄로 넘어가요.
export default function StarNode({
  color,
  name,
  cx,
  cy,
  size = NODE_STAR,
  selected = false,
  pop = false,
  panHandlers,
  style,
  accessibilityLabel,
  onAccessibilityTap,
}: Props) {
  const popStyle = usePop();
  const pulse = usePulse(selected);
  const ringColor = color === 'grey' ? STAR.mint.c300 : STAR[color].c300;
  const ring = {
    borderColor: ringColor,
    width: size + 16,
    height: size + 16,
    borderRadius: (size + 16) / 2,
  };
  return (
    <Animated.View
      {...panHandlers}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? name}
      accessibilityState={{ selected }}
      onAccessibilityTap={onAccessibilityTap}
      style={[styles.node, { left: cx - 50, top: cy - size / 2 }, pop && popStyle, style]}
    >
      <View style={{ width: size, height: size }}>
        {selected ? (
          <>
            <View style={[styles.ring, ring]} />
            <Animated.View style={[styles.ring, ring, pulse]} />
          </>
        ) : null}
        <JellyStar color={color} size={size} />
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
    color: INK[1],
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  ring: {
    position: 'absolute',
    left: -8,
    top: -8,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
});
