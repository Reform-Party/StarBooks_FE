import { router } from 'expo-router';

import IslandSelectScreen from '@/features/explore/components/island-select-screen';

export default function IslandsRoute() {
  return (
    <IslandSelectScreen
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
