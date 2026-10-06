import { StyleSheet, Text } from 'react-native';

import CenterModal from '@/features/commentary/components/center-modal';
import JellyButton from '@/features/commentary/components/jelly-button';
import { TYPE } from '@/features/commentary/constants/typography';

type Props = { title: string; sub: string; onRetry: () => void };

// 게임을 시작하지 못했을 때 (관계도 준비 중 · 연결 오류)
export default function StatusPanel({ title, sub, onRetry }: Props) {
  return (
    <CenterModal width={420} scrimOpacity={0.3} style={styles.panel}>
      <Text style={TYPE.h2}>{title}</Text>
      <Text style={[TYPE.cap, styles.sub]}>{sub}</Text>
      <JellyButton tone="yellow" minWidth={170} onPress={onRetry}>
        다시 시도하기
      </JellyButton>
    </CenterModal>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 24, alignItems: 'center', gap: 10 },
  sub: { textAlign: 'center' },
});
