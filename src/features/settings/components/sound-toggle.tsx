import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import AppText from '@/components/ui/app-text';
import Icon, { type IconName } from '@/components/ui/icon';
import PressableScale from '@/components/ui/pressable-scale';
import { GLASS, INK, STAR } from '@/constants/colors';
import { DURATION, SPRING_EASING } from '@/constants/motion';
import { TYPE } from '@/constants/typography';

const SIZE = 48;

type Props = {
  icon: Extract<IconName, 'volume' | 'music'>;
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
};

// 효과음 · 배경음악 켜고 끄기 (Figma Sound Toggle ⌀48 · 켜짐 민트 / 꺼짐 유리 · 스프링 0.25s)
export default function SoundToggle({ icon, label, value, onChange }: Props) {
  const on = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    on.set(withTiming(value ? 1 : 0, { duration: DURATION.toggle, easing: SPRING_EASING }));
  }, [value, on]);

  const mintStyle = useAnimatedStyle(() => ({
    opacity: on.get(),
    transform: [{ scale: 0.85 + 0.15 * on.get() }],
  }));

  const mint = STAR.mint;
  return (
    <View style={styles.item}>
      <PressableScale
        width={SIZE}
        height={SIZE}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: value }}
        onPress={() => onChange(!value)}
        style={styles.toggle}
      >
        <Animated.View style={[styles.mint, mintStyle]} pointerEvents="none">
          <Svg width={SIZE} height={SIZE}>
            <Defs>
              <LinearGradient id="sound-toggle-on" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={mint.c300} />
                <Stop offset="1" stopColor={mint.c500} />
              </LinearGradient>
            </Defs>
            <Circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2} fill="url(#sound-toggle-on)" />
          </Svg>
        </Animated.View>
        <Icon name={icon} color={value ? mint.on : INK[2]} />
      </PressableScale>
      {/* 스위치가 이미 같은 이름을 읽어서, 아래 글씨는 스크린 리더에서 숨겨요. */}
      <AppText
        style={[TYPE.captionBold, styles.label]}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { alignItems: 'center', gap: 3 },
  toggle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GLASS.fill,
    borderWidth: 1,
    borderColor: GLASS.line,
  },
  // 켜졌을 때는 유리 테두리까지 민트로 덮어요.
  mint: { position: 'absolute', top: -1, left: -1, width: SIZE, height: SIZE },
  label: { color: INK[2] },
});
