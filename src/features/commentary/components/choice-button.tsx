import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import PressableScale from '@/components/ui/pressable-scale';
import { GLASS, INK, STAR } from '@/constants/colors';
import { RADIUS, SPACE } from '@/constants/layout';
import { TYPE } from '@/constants/typography';
import Text from '@/features/commentary/components/app-text';

const MIN_H = 42;

type Props = {
  label: string;
  state: 'idle' | 'right' | 'wrong';
  accessibilityLabel?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

// 관계 퀴즈 선택지. 서버가 만든 문장이라 길이를 알 수 없어서 최소 높이만 정하고 두 줄까지 늘어나요.
// 정답 = 민트, 틀린 답 = 분홍. 누름 모션은 공용 PressableScale 을 써요.
export default function ChoiceButton({ label, state, accessibilityLabel, onPress, style }: Props) {
  return (
    <PressableScale
      height={MIN_H}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={[
        styles.choice,
        state === 'right' && styles.right,
        state === 'wrong' && styles.wrong,
        style,
      ]}
    >
      <Text
        numberOfLines={2}
        style={[TYPE.body, styles.label, state === 'right' && styles.rightLabel]}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  choice: {
    width: '100%',
    minHeight: MIN_H,
    justifyContent: 'center',
    paddingHorizontal: SPACE[5],
    paddingVertical: SPACE[2],
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: GLASS.line,
    backgroundColor: GLASS.fill,
  },
  right: { backgroundColor: STAR.mint.c300, borderColor: STAR.mint.rim },
  wrong: {
    backgroundColor: 'rgba(244,114,182,0.22)',
    borderColor: STAR.pink.rim,
    opacity: 0.75,
  },
  label: { color: INK[1], fontSize: 17.5, textAlign: 'center' },
  rightLabel: { color: STAR.mint.on },
});
