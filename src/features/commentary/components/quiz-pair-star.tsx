import { StyleSheet, View } from 'react-native';

import Text from '@/features/commentary/components/app-text';
import JellyStar from '@/components/ui/jelly-star';
import { FONT } from '@/constants/fonts';
import { INK, type StarColor } from '@/constants/colors';

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
