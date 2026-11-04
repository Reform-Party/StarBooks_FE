import { router } from 'expo-router';

import SharedStoriesScreen from '@/features/explore/components/shared-stories-screen';

export default function TravelRoute() {
  return (
    <SharedStoriesScreen
      onHome={() => router.dismissTo('/')}
      onSelectStory={(story) =>
        router.push({
          pathname: '/story/[id]',
          params: { id: story.id },
        })
      }
    />
  );
}
