import { useMemo, useSyncExternalStore } from 'react';

import { useAuthStore } from '@/features/auth/store/auth-store';
import { type SavedStory, useOfflineStore } from '@/features/offline/store/offline-store';

const subscribeHydration = (onChange: () => void) =>
  useOfflineStore.persist.onFinishHydration(onChange);
const isHydrated = () => useOfflineStore.persist.hasHydrated();

const EMPTY: Record<string, SavedStory> = {};

// 오프라인 모드 계정이 저장한 동화. 최근에 저장한 동화가 앞에 와요.
// 기기 저장소를 다 읽기 전에는 hydrated 가 false 예요. (빈 책장이 번쩍이지 않게)
export function useSavedStories() {
  const userId = useAuthStore((s) => s.offlineUserId);
  const saved = useOfflineStore((s) => (userId ? (s.saved[userId] ?? EMPTY) : EMPTY));
  const hydrated = useSyncExternalStore(subscribeHydration, isHydrated, () => true);
  const stories = useMemo(
    () => Object.values(saved).sort((a, b) => b.savedAt - a.savedAt),
    [saved],
  );
  return { userId, stories, hydrated };
}
