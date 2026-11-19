import { router } from 'expo-router';

import { useMyStories } from '@/features/explore/hooks/use-my-stories';

import IslandSelectScreen from '@/features/explore/components/island-select-screen';

export default function IslandsRoute() {
  const fantasy = useMyStories('fantasy', 0);
  const medieval = useMyStories('medieval', 0);
  const folktale = useMyStories('folktale', 0);

  return (
    <IslandSelectScreen
      storyCounts={{
        fantasy: fantasy.data?.totalElements,
        medieval: medieval.data?.totalElements,
        folktale: folktale.data?.totalElements,
      }}
      onHome={() => router.dismissTo('/')}
      onSelectIsland={(island) =>
        router.push({
          pathname: '/islands/[island]',
          params: { island: island.id },
        })
      }
    />
  );
}
