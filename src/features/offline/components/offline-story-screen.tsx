import { skipToken, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { useAuthStore } from '@/features/auth/store/auth-store';
import OfflineNoticeModal, {
  type OfflineNotice,
} from '@/features/offline/components/offline-notice-modal';
import { useOfflineStore } from '@/features/offline/store/offline-store';
import { loadOfflineStory } from '@/features/offline/utils/story-files';
import StoryFrameScreen from '@/features/story/components/story-frame-screen';
import type { StoryNarration } from '@/features/story/hooks/use-story-narration';

type Props = {
  id: string | null;
  onLeave: () => void;
};

// 기기에 저장한 동화를 읽어요. 서버에 음성을 확인 · 요청하지 않고 저장한 음성만 재생해요.
export default function OfflineStoryScreen({ id, onLeave }: Props) {
  const userId = useAuthStore((s) => s.offlineUserId);
  const unmarkSaved = useOfflineStore((s) => s.unmarkSaved);
  const [notice, setNotice] = useState<OfflineNotice | null>(null);
  const saved = useQuery({
    queryKey: ['offline-story', userId, id],
    queryFn:
      userId && id
        ? async () => {
            const story = await loadOfflineStory(userId, id);
            // 저장 표시는 있는데 파일이 없으면(지워졌으면) 책장에서도 빼요.
            if (!story) unmarkSaved(userId, id);
            return story;
          }
        : skipToken,
    networkMode: 'always',
    staleTime: 0,
    retry: false,
  });
  const story = saved.data ?? null;
  const missing = !id || !userId || saved.isError || (saved.isSuccess && !story);
  const pages = story?.pages ?? [];

  const narration: StoryNarration = {
    diagnostics: undefined,
    pages,
    message: undefined,
    pending: false,
    // 저장한 음성이 없는 쪽에서 재생을 누르면 다운로드 안내를 띄워요.
    onRequest: pages.some((page) => !page.ttsUrl) ? async () => setNotice('voice') : undefined,
    onRetry: undefined,
  };
  const activeNotice: OfflineNotice | null = missing ? 'download' : notice;

  return (
    <StoryFrameScreen
      title={missing ? '다운로드가 필요한 동화예요' : (story?.title ?? null)}
      authorName={story?.authorName}
      vocab={story?.vocab}
      pages={pages}
      narration={narration}
      totalPages={pages.length}
      streaming={false}
      error={null}
      onHome={onLeave}
      overlay={
        activeNotice ? (
          <OfflineNoticeModal
            notice={activeNotice}
            onClose={missing ? onLeave : () => setNotice(null)}
          />
        ) : null
      }
    />
  );
}
