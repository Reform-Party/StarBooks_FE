import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import JellyStar from '@/components/ui/jelly-star';
import { GLASS, INK, STAR } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { TYPE } from '@/constants/typography';
import { labelColor } from '@/features/make/constants/label-color';
import { STAR_POP } from '@/features/make/constants/motion';
import {
  findOption,
  MAKE_STEPS,
  type MakeSelection,
} from '@/features/make/constants/story-options';

type Props = {
  title: string;
  selection: MakeSelection;
  onJumpStep: (index: number) => void;
};

// 만들기 1 ~ 3단계 위쪽: Gaegu 제목 + 슬롯 3칸(교훈 · 주인공 · 배경)
// 고른 칸은 그 색 젤리 별이 톡 들어가고 이름이 그 색으로, 빈 칸은 어두운 원 + 회색 이름이에요.
export default function MakeHeader({ title, selection, onJumpStep }: Props) {
  return (
    <>
      <Text accessibilityRole="header" style={[TYPE.heading, styles.title]}>
        {title}
      </Text>
      <View style={styles.slots}>
        {MAKE_STEPS.map((s, i) => {
          const chosen = findOption(s.options, selection[s.key]);
          return (
            <Pressable
              key={s.key}
              accessibilityRole="button"
              accessibilityLabel={
                chosen ? `${s.starLabel}: ${chosen.label} (눌러서 고치기)` : `${s.starLabel} 고르기`
              }
              onPress={() => onJumpStep(i)}
              style={styles.slot}
            >
              <View style={[styles.ring, chosen && { borderColor: STAR[s.tone].c300 }]}>
                {chosen ? (
                  <Animated.View key={chosen.id} entering={STAR_POP}>
                    <JellyStar color={s.tone} size={18} />
                  </Animated.View>
                ) : null}
              </View>
              <Text
                numberOfLines={1}
                style={[styles.slotLabel, { color: chosen ? labelColor(s.tone) : INK[3] }]}
              >
                {chosen ? chosen.label : s.starLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  title: { position: 'absolute', top: 16, left: 0, right: 0, textAlign: 'center', color: INK[1] },
  slots: {
    position: 'absolute',
    top: 61,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  slot: { width: 78, alignItems: 'center', gap: 3 },
  ring: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GLASS.line,
    backgroundColor: GLASS.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotLabel: { includeFontPadding: false, fontFamily: FONT.sansBold, fontSize: 13 },
});
