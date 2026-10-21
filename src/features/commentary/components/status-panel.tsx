import { StyleSheet } from 'react-native';

import CenterModal from '@/components/ui/center-modal';
import JellyButton from '@/components/ui/jelly-button';
import { INK } from '@/constants/colors';
import { SPACE } from '@/constants/layout';
import { TYPE } from '@/constants/typography';
import Text from '@/features/commentary/components/app-text';

type Props = { title: string; sub: string; onRetry: () => void };

const PANEL_W = 420;

// 게임을 시작하지 못했을 때 (관계도 준비 중 · 연결 오류 · 세션 만료)
export default function StatusPanel({ title, sub, onRetry }: Props) {
  return (
    <CenterModal visible scrimColor="rgba(5,6,18,0.3)" panelStyle={styles.panel}>
      <Text style={[TYPE.heading, styles.title]}>{title}</Text>
      <Text style={[TYPE.caption, styles.sub]}>{sub}</Text>
      <JellyButton label="다시 시도하기" tone="yellow" width={170} onPress={onRetry} />
    </CenterModal>
  );
}

const styles = StyleSheet.create({
  panel: { width: PANEL_W, padding: SPACE[6], alignItems: 'center', gap: SPACE[4] },
  title: { color: INK[1], textAlign: 'center' },
  sub: { color: INK[3], textAlign: 'center' },
});
