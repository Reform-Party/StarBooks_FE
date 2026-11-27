import { StyleSheet, Text } from 'react-native';

import CenterModal from '@/components/ui/center-modal';
import JellyButton from '@/components/ui/jelly-button';
import JellyStar from '@/components/ui/jelly-star';
import { INK, type StarColor } from '@/constants/colors';
import { TYPE } from '@/constants/typography';

type Props = {
  visible: boolean;
  // pink: 오답 · 빈 칸 안내 / mint: 완료 / yellow: 일반
  tone?: StarColor;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction: () => void;
};

// 젤리 별 + 제목 + 버튼 하나로 된 알림창 (Figma 패널 · 모달)
export default function AlertModal({
  visible,
  tone = 'yellow',
  title,
  message,
  actionLabel = '확인',
  onAction,
}: Props) {
  return (
    <CenterModal visible={visible} onRequestClose={onAction} panelStyle={styles.panel}>
      <JellyStar color={tone} size={48} />
      <Text accessibilityRole="header" style={[TYPE.heading, styles.title]}>
        {title}
      </Text>
      {message ? <Text style={[TYPE.caption, styles.message]}>{message}</Text> : null}
      <JellyButton label={actionLabel} onPress={onAction} style={styles.action} />
    </CenterModal>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: 320,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 22,
    alignItems: 'center',
  },
  title: { marginTop: 12, color: INK[1], textAlign: 'center' },
  message: { marginTop: 6, color: INK[2], textAlign: 'center' },
  action: { marginTop: 18, minWidth: 120 },
});
