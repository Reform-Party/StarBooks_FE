import { router } from 'expo-router';

import MainScreen from '@/features/main/components/main-screen';
import { useMakeStore } from '@/features/make/store/make-store';

export default function MainRoute() {
  const resetMake = useMakeStore((s) => s.reset);
  return (
    <MainScreen
      onStartMake={() => {
        resetMake();
        router.push('/make/lesson');
      }}
    />
  );
}
