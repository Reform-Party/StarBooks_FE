import { StyleSheet, View } from 'react-native';

import Icon from '@/components/ui/icon';
import { INK, STAR } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { SCREEN } from '@/constants/layout';
import { TYPE } from '@/constants/typography';
import Text from '@/features/commentary/components/app-text';
import JellyLabel from '@/features/commentary/components/jelly-label';
import StepChip from '@/features/commentary/components/step-chip';

const LABELS = ['분류하기', '관계 잇기', '별자리 완성'];

type Props = { step: 1 | 2 | 3; title: string; sub?: string };

// 위쪽 가운데: 단계 표시(지금 = 노란 이름표, 끝남 = 민트 칩 ✓, 남음 = 흐린 칩) · 제목 · 설명
export default function StepHeader({ step, title, sub }: Props) {
  return (
    <>
      <View
        style={[styles.row, styles.steps]}
        accessibilityRole="header"
        accessibilityLabel={`${step}단계 ${LABELS[step - 1]}`}
      >
        {LABELS.map((label, i) => {
          const n = i + 1;
          if (n === step)
            return (
              <JellyLabel key={label} tone="yellow" height={32} style={styles.current}>
                {`${n} ${label}`}
              </JellyLabel>
            );
          if (n < step)
            return (
              <StepChip key={label} tone="mint">
                <Icon name="check" color={STAR.mint.rim} />
                {label}
              </StepChip>
            );
          return (
            <StepChip key={label} textStyle={styles.todo}>
              {`${n} ${label}`}
            </StepChip>
          );
        })}
      </View>
      <View style={[styles.row, styles.title]}>
        <Text style={[TYPE.heading, styles.titleText]}>{title}</Text>
      </View>
      {sub ? (
        <View style={[styles.row, styles.sub]}>
          <Text style={[TYPE.caption, styles.subText]}>{sub}</Text>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    left: 0,
    width: SCREEN.width,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  steps: { top: 14 },
  title: { top: 50 },
  sub: { top: 84 },
  current: { paddingHorizontal: 12, gap: 5 },
  todo: { color: INK[3] },
  titleText: { color: INK[1], textAlign: 'center' },
  subText: { color: INK[2], fontFamily: FONT.sans },
});
