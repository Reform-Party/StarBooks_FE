import { StyleSheet } from 'react-native';

import CenterModal from '@/components/ui/center-modal';
import VoiceRecordContent from '@/features/settings/components/voice-record-content';

type Props = {
  visible: boolean;
  onClose: () => void; // 녹음 취소 · 모달 닫힘
  onSaved: () => void; // 1분 녹음을 올렸어요
  onDenied: () => void; // 마이크 권한이 없어요
  onError: (message: string) => void;
};

// 목소리 등록 모달 (Figma 목소리 등록 · 480 × 344)
// CenterModal 은 닫혀 있으면 아무것도 그리지 않아서, 녹음은 모달이 열려 있는 동안만 돌아요.
export default function VoiceRecordModal({ visible, onClose, onSaved, onDenied, onError }: Props) {
  return (
    // 아이가 기기를 잡다가 패널 밖을 건드려도 녹음이 취소되지 않게, 닫기 버튼 · 뒤로 가기로만 닫아요.
    <CenterModal
      visible={visible}
      onRequestClose={onClose}
      dismissOnScrimPress={false}
      panelStyle={styles.panel}
    >
      <VoiceRecordContent
        onClose={onClose}
        onSaved={onSaved}
        onDenied={onDenied}
        onError={onError}
      />
    </CenterModal>
  );
}

const styles = StyleSheet.create({
  panel: { width: 480, height: 344, alignItems: 'center', paddingTop: 16 },
});
