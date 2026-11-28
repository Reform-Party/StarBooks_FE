import { useEffect } from 'react';

import { useAuthStore } from '@/features/auth/store/auth-store';
import { useOfflineStore } from '@/features/offline/store/offline-store';
import { saveNarrationOffline, saveStoryOffline } from '@/features/offline/utils/story-files';
import { isNumericStoryId } from '@/features/story/api/story-api';
import type { Story, StoryPage } from '@/features/story/api/types';

// 온라인에서 연 동화의 본문 · 삽화와 확인된 낭독 음성을 기기에 저장해요.
// 저장한 동화는 오프라인으로 앱을 켰을 때 오프라인 책장에 보여요.
export function useOfflineStorySync(story: Story | undefined, narrationPages?: StoryPage[]) {
  const userId = useAuthStore((s) => s.user?.id);
  const markSaved = useOfflineStore((s) => s.markSaved);
  const storyId = story && isNumericStoryId(story.id) ? story.id : null;

  useEffect(() => {
    if (!userId || !story || !storyId) return;
    saveStoryOffline(userId, story)
      .then((saved) => {
        if (saved) {
          markSaved(userId, { id: storyId, title: story.title, authorName: story.authorName });
        }
      })
      .catch(() => undefined);
  }, [userId, story, storyId, markSaved]);

  useEffect(() => {
    if (!userId || !storyId || !narrationPages) return;
    saveNarrationOffline(userId, storyId, narrationPages).catch(() => undefined);
  }, [userId, storyId, narrationPages]);
}
