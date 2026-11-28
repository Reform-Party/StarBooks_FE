import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// 오프라인 책장에 보여 줄 저장한 동화. 본문 · 삽화 · 음성은 story-files 가 파일로 둬요.
export type SavedStory = {
  id: string;
  title: string;
  authorName?: string;
  savedAt: number;
};

type OfflineState = {
  // 계정 → 동화 id → 저장한 동화
  saved: Record<string, Record<string, SavedStory>>;
  markSaved: (userId: string, story: Omit<SavedStory, 'savedAt'>) => void;
  unmarkSaved: (userId: string, storyId: string) => void;
};

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set) => ({
      saved: {},
      markSaved: (userId, story) =>
        set((s) => {
          const previous = s.saved[userId]?.[story.id];
          if (
            previous &&
            previous.title === story.title &&
            previous.authorName === story.authorName
          ) {
            return s;
          }
          return {
            saved: {
              ...s.saved,
              [userId]: {
                ...s.saved[userId],
                // 처음 저장한 순서를 지켜요. 제목만 바뀌면 시각은 그대로 둬요.
                [story.id]: { ...story, savedAt: previous?.savedAt ?? Date.now() },
              },
            },
          };
        }),
      unmarkSaved: (userId, storyId) =>
        set((s) => {
          if (!s.saved[userId]?.[storyId]) return s;
          const { [storyId]: _removed, ...rest } = s.saved[userId];
          return { saved: { ...s.saved, [userId]: rest } };
        }),
    }),
    {
      name: 'offline-stories',
      version: 0,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ saved }) => ({ saved }),
    },
  ),
);
