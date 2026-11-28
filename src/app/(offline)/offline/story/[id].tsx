import { router, useLocalSearchParams } from 'expo-router';

import OfflineStoryScreen from '@/features/offline/components/offline-story-screen';
import { isNumericStoryId } from '@/features/story/api/story-api';

export default function OfflineStoryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <OfflineStoryScreen
      id={isNumericStoryId(id) ? id : null}
      onLeave={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/offline');
      }}
    />
  );
}
