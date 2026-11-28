import AlertModal from '@/components/ui/alert-modal';

// download: 기기에서 본문을 찾지 못했어요 / voice: 이 쪽의 음성을 저장하지 않았어요
export type OfflineNotice = 'download' | 'voice';

const NOTICES: Record<OfflineNotice, { title: string; message: string }> = {
  download: {
    title: '다운로드가 필요합니다',
    message: '이 동화는 기기에 저장되어 있지 않아요. 인터넷에 연결된 상태에서 다시 읽어 주세요.',
  },
  voice: {
    title: '다운로드가 필요합니다',
    message:
      '이 쪽의 읽어주기 음성이 저장되어 있지 않아요. 인터넷에 연결된 상태에서 음성을 들으면 저장돼요.',
  },
};

type Props = {
  notice: OfflineNotice | null;
  onClose: () => void;
};

// 오프라인에서 저장하지 않은 동화 리소스를 열면 띄워요. 확인을 누를 때까지 뒤 화면을 막아요.
export default function OfflineNoticeModal({ notice, onClose }: Props) {
  const content = notice ? NOTICES[notice] : null;
  return (
    <AlertModal
      visible={content !== null}
      tone="pink"
      title={content?.title ?? ''}
      message={content?.message}
      onAction={onClose}
      dismissOnScrimPress={false}
    />
  );
}
