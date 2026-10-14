import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GLASS, INK, STAR } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { TYPE } from '@/constants/typography';

type Option<T extends string> = { id: T; label: string };

type Props<T extends string> = {
  label: string;
  options: readonly Option<T>[];
  value: T | null;
  onChange: (id: T) => void;
};

// Figma 입력 · 선택 › 성별 세그먼트: 고른 칸만 민트로 채워요.
export default function Segmented<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.row}>
        {options.map((o) => {
          const on = o.id === value;
          return (
            <Pressable
              key={o.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => onChange(o.id)}
              style={({ pressed }) => [
                styles.option,
                on ? styles.on : styles.off,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.text, { color: on ? STAR.mint.on : INK[2] }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { width: '100%', gap: 6 },
  label: { ...TYPE.caption, fontFamily: FONT.sansSemi, color: INK[2] },
  row: { flexDirection: 'row', gap: 6 },
  option: {
    flex: 1,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  on: {
    backgroundColor: STAR.mint.c300,
    borderTopWidth: 2,
    borderTopColor: 'rgba(255,255,255,0.45)',
  },
  off: { backgroundColor: GLASS.fill, borderWidth: 1, borderColor: GLASS.line },
  pressed: { transform: [{ scale: 0.96 }] },
  text: { includeFontPadding: false, fontFamily: FONT.pop, fontSize: 18 },
});
