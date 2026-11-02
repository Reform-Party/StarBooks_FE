import { StyleSheet } from 'react-native';

import AppText from '@/components/ui/app-text';
import CenterModal from '@/components/ui/center-modal';
import Icon from '@/components/ui/icon';
import JellyButton from '@/components/ui/jelly-button';
import JellyStar from '@/components/ui/jelly-star';
import { INK } from '@/constants/colors';
import { TYPE } from '@/constants/typography';

const BUTTON_W = 258;

type Props = {
  visible: boolean;
  onClose: () => void;
  onPressDefault: () => void; // 기본 프로필로 바꾸기 → 즉시 적용 + 닫힘
  onPressAlbum: () => void; // 앨범에서 사진 고르기 → 사진 권한 요청 → 앨범
};

// 프로필 사진 모달 (Figma 프로필 사진 · 300 × 226.5)
export default function ProfilePhotoModal({
  visible,
  onClose,
  onPressDefault,
  onPressAlbum,
}: Props) {
  return (
    <CenterModal visible={visible} onRequestClose={onClose} panelStyle={styles.panel}>
      <AppText style={[TYPE.heading, styles.title]} accessibilityRole="header">
        프로필 사진
      </AppText>
      <JellyButton
        tone="glass"
        label="기본 프로필로 바꾸기"
        icon={<JellyStar size={16.5} />}
        width={BUTTON_W}
        onPress={onPressDefault}
        style={styles.firstButton}
      />
      <JellyButton
        tone="glass"
        label="앨범에서 사진 고르기"
        icon={<Icon name="image" />}
        width={BUTTON_W}
        onPress={onPressAlbum}
      />
      <JellyButton tone="plain" label="닫기" width={BUTTON_W} height={36} onPress={onClose} />
    </CenterModal>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: 300,
    alignItems: 'center',
    gap: 8,
    paddingTop: 20,
    paddingHorizontal: 21,
    paddingBottom: 21,
  },
  title: { color: INK[1], textAlign: 'center' },
  firstButton: { marginTop: 4 },
});
