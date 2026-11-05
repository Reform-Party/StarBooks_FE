import { Redirect, router, useLocalSearchParams } from 'expo-router';

import MyConstellationScreen from '@/features/explore/components/my-constellation-screen';
import { ISLANDS } from '@/features/explore/constants/islands';

export default function IslandConstellationRoute() {
  const { island: islandId } = useLocalSearchParams<{
    island?: string | string[];
  }>();

  const island = ISLANDS.find((item) => item.id === islandId);

  if (!island) {
    return <Redirect href="/islands" />;
  }

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/islands');
    }
  };

  return (
    <MyConstellationScreen
      key={island.id}
      island={island}
      onBack={handleBack}
      onSelectStory={(story) =>
        router.push({
          pathname: '/story/[id]',
          params: { id: story.id },
        })
      }
    />
  );
}
