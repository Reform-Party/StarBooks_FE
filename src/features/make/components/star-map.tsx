import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import JellyStar from '@/components/ui/jelly-star';
import { INK } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import OutlineStar from '@/features/make/components/outline-star';
import { labelColor } from '@/features/make/constants/label-color';
import { STAR_POP } from '@/features/make/constants/motion';
import type { MakeKey, MakeStep } from '@/features/make/constants/story-options';

// 별 중심 좌표 (874 × 402). 교훈 12: 4 · 3 · 5 지그재그 / 주인공 3: 큰 별 한 줄 / 배경 8: 4 × 2
const LAYOUTS: Record<
  MakeKey,
  { size: number; labelSize: number; rows: { y: number; xs: number[] }[] }
> = {
  lesson: {
    size: 38,
    labelSize: 15,
    rows: [
      { y: 133, xs: [253, 375, 497, 619] },
      { y: 212, xs: [314, 436, 558] },
      { y: 293, xs: [192, 314, 436, 558, 680] },
    ],
  },
  species: { size: 60, labelSize: 17, rows: [{ y: 212, xs: [263, 436, 609] }] },
  background: {
    size: 38,
    labelSize: 15,
    rows: [
      { y: 179, xs: [227, 367, 507, 647] },
      { y: 255, xs: [227, 367, 507, 647] },
    ],
  },
};

const SPOT_W = 116; // 이름이 가장 긴 "다름을 인정하기" 가 들어가는 폭
const ROW_DELAY_MS = 60;
const SHAKE = [-6, 6, -4, 3, 0];

type Props = {
  step: MakeStep;
  selectedId: string | null;
  onToggle: (id: string) => void;
  // 값이 바뀔 때마다 별 영역이 좌우로 흔들려요. (안 고르고 "다음" 을 눌렀을 때)
  shakeKey: number;
};

// 별 지도: 선택지 하나 = 별 하나. 고르지 않은 별은 점선, 고른 별은 젤리 별 + 이름이 그 색으로.
// 진입할 때 줄마다 60ms 간격으로 떠올라요.
export default function StarMap({ step, selectedId, onToggle, shakeKey }: Props) {
  const layout = LAYOUTS[step.key];
  const spots = layout.rows.flatMap((row, r) => row.xs.map((x) => ({ x, y: row.y, row: r })));
  const x = useSharedValue(0);

  useEffect(() => {
    if (shakeKey === 0) return;
    x.set(withSequence(...SHAKE.map((v) => withTiming(v, { duration: 60 }))));
  }, [shakeKey, x]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  return (
    <Animated.View
      accessibilityRole="radiogroup"
      accessibilityLabel={step.starLabel}
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, shakeStyle]}
    >
      {step.options.map((o, i) => {
        const spot = spots[i];
        const on = o.id === selectedId;
        return (
          <Animated.View
            key={o.id}
            entering={FadeInDown.delay(spot.row * ROW_DELAY_MS).duration(350)}
            style={[styles.spot, { left: spot.x - SPOT_W / 2, top: spot.y - layout.size / 2 }]}
          >
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={o.label}
              onPress={() => onToggle(o.id)}
              style={styles.press}
            >
              <View style={{ width: layout.size, height: layout.size }}>
                {on ? (
                  <Animated.View entering={STAR_POP}>
                    <JellyStar color={step.tone} size={layout.size} />
                  </Animated.View>
                ) : (
                  <OutlineStar color={step.tone} size={layout.size} />
                )}
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.name,
                  { fontSize: layout.labelSize, color: on ? labelColor(step.tone) : INK[2] },
                ]}
              >
                {o.label}
              </Text>
            </Pressable>
          </Animated.View>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  spot: { position: 'absolute', width: SPOT_W, alignItems: 'center' },
  press: { minWidth: 44, alignItems: 'center', gap: 4 },
  name: { includeFontPadding: false, fontFamily: FONT.pop, lineHeight: 20 },
});
