import { StyleSheet, Text, View } from 'react-native';

import Chip from '@/components/ui/chip';
import { STAR } from '@/constants/colors';
import { FONT } from '@/constants/fonts';

type Props = {
  title: string;
  step: string;
};

// "회원가입 1 / 2" 처럼 Gaegu 노란 제목 + 단계 칩
export default function StepTitle({ title, step }: Props) {
  return (
    <View style={styles.row}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Chip label={step} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: {
    includeFontPadding: false,
    fontFamily: FONT.hand,
    fontSize: 30,
    lineHeight: 36,
    color: STAR.yellow.c300,
    textShadowColor: `${STAR.yellow.c300}55`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
