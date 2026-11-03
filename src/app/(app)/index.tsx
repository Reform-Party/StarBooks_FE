import { router } from 'expo-router';

import MainScreen from '@/features/main/components/main-screen';
import { useMakeStore } from '@/features/make/store/make-store';
import { useGenerationStore } from '@/features/story/store/generation-store';

export default function MainRoute() {
  const resetMake = useMakeStore((s) => s.reset);
  const resetGeneration = useGenerationStore((s) => s.reset);
  return (
    <MainScreen
      onStartMake={() => {
        resetMake();
        resetGeneration();
        router.push('/make/lesson');
      }}
    />
  );
}
