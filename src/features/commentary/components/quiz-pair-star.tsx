import { StyleSheet, Text, View } from 'react-native';

import JellyStar from '@/features/commentary/components/jelly-star';
import { FONT, INK, type StarColor } from '@/features/commentary/constants/theme';

type Props = { color: StarColor; name: string };

// 퀴즈 위쪽 "별 — 별" 줄의 작은 별 + 이름
export default function QuizPairStar({ color, name }: Props) {
  return (
    <View style={styles.wrap}>
      <JellyStar color={color} size={30} />
      <Text numberOfLines={2} style={styles.name}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { minWidth: 64, maxWidth: 130, alignItems: 'center', gap: 1 },
  name: { fontFamily: FONT.sansBold, fontSize: 13, color: INK[1], textAlign: 'center' },
});
