import { router } from 'expo-router';
import { useState } from 'react';

import IslandSelectScreen from '@/features/explore/components/island-select-screen';
import MyConstellationScreen from '@/features/explore/components/my-constellation-screen';
import type { Island } from '@/features/explore/constants/islands';

export default function IslandsRoute() {
  const [selectedIsland, setSelectedIsland] = useState<Island | null>(null);

  if (selectedIsland) {
    return (
      <MyConstellationScreen
        island={selectedIsland}
        onBack={() => setSelectedIsland(null)}
        onSelectStory={(story) =>
          router.push({
            pathname: '/story/[id]',
            params: { id: story.id },
          })
        }
      />
    );
  }

  return <IslandSelectScreen onSelectIsland={setSelectedIsland} />;
}
