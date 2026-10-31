import {
  type AccessibilityActionEvent,
  Animated,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import JellyStar from '@/components/ui/jelly-star';
import { INK, STAR, type StarColor } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import Text from '@/features/commentary/components/app-text';
import { NODE_STAR } from '@/features/commentary/constants/board';
import { WRONG_TINT } from '@/features/commentary/constants/palette';
import { usePop, usePulse } from '@/features/commentary/hooks/use-motion';

type Props = {
  color: StarColor;
  name: string;
  cx: number;
  cy: number;
  size?: number;
  // 고른 별 둘레에 퍼지는 링 (2단계 톡 · 톡 잇기, 선 끝이 닿은 별)
  selected?: boolean;
  pop?: boolean;
  // 0 → 1 → 0 으로 움직이면 별이 잠깐 붉어져요 (오답)
  tint?: Animated.Value;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  // 스크린 리더의 "활성화"(VoiceOver · TalkBack 두 번 탭). 있을 때만 버튼으로 읽혀요.
  onActivate?: () => void;
};

const ACTIONS = [{ name: 'activate' }];

// 이야기 별 = 젤리 별 + 아래 이름. (cx, cy) 는 별의 한가운데. 긴 이름은 두 줄로 넘어가요.
// 누를 수 없는 별(onActivate 없음)은 스크린 리더에 버튼이 아니라 이름으로만 읽혀요.
export default function StarNode({
  color,
  name,
  cx,
  cy,
  size = NODE_STAR,
  selected = false,
  pop = false,
  tint,
  style,
  accessibilityLabel,
  onActivate,
}: Props) {
  const popStyle = usePop();
  const pulse = usePulse(selected);
  const ring = {
    borderColor: STAR[color].c300,
    width: size + 16,
    height: size + 16,
    borderRadius: (size + 16) / 2,
  };
  const handleAction = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === 'activate') onActivate?.();
  };
  return (
    <Animated.View
      accessible
      accessibilityLabel={accessibilityLabel ?? name}
      accessibilityRole={onActivate ? 'button' : undefined}
      accessibilityState={onActivate ? { selected } : undefined}
      accessibilityActions={onActivate ? ACTIONS : undefined}
      onAccessibilityAction={onActivate ? handleAction : undefined}
      style={[styles.node, { left: cx - 50, top: cy - size / 2 }, pop && popStyle, style]}
    >
      <View style={{ width: size, height: size }}>
        {selected ? (
          <>
            <View style={[styles.ring, ring]} />
            <Animated.View style={[styles.ring, ring, pulse]} />
          </>
        ) : null}
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
  ring: {
    position: 'absolute',
    left: -8,
    top: -8,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
});
