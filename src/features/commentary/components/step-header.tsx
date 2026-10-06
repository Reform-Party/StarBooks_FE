import { StyleSheet, Text, View } from 'react-native';

import Chip from '@/features/commentary/components/chip';
import Icon from '@/features/commentary/components/icon';
import JellyButton from '@/features/commentary/components/jelly-button';
import { W } from '@/features/commentary/constants/layout';
import { FONT, INK } from '@/features/commentary/constants/theme';
import { TYPE } from '@/features/commentary/constants/typography';

const LABELS = ['분류하기', '관계 잇기', '별자리 완성'];

type Props = { step: 1 | 2 | 3; title: string; sub?: string };

// 위쪽 가운데: 단계 표시(지금 = 노란 버튼, 끝남 = 민트 칩 ✓, 남음 = 흐린 칩) · 제목 · 설명
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
              <JellyButton
                key={label}
                tone="yellow"
                height={32}
                font="sans"
                fontSize={14.5}
                style={styles.current}
              >
                {`${n} ${label}`}
              </JellyButton>
            );
          if (n < step)
            return (
              <Chip key={label} tone="mint">
                <Icon name="check" size={12} color="#99F6E4" />
                {label}
              </Chip>
            );
          return (
            <Chip key={label} textStyle={styles.todo}>
              {`${n} ${label}`}
            </Chip>
          );
        })}
      </View>
      <View style={[styles.row, styles.title]}>
        <Text style={TYPE.h2}>{title}</Text>
      </View>
      {sub ? (
        <View style={[styles.row, styles.sub]}>
          <Text style={[TYPE.cap, styles.subText]}>{sub}</Text>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    left: 0,
    width: W,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  steps: { top: 14 },
  title: { top: 50 },
  sub: { top: 84 },
  current: { paddingHorizontal: 12, gap: 5 },
  todo: { color: INK[3] },
  subText: { color: INK[2], fontFamily: FONT.sans },
});
