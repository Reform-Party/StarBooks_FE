import { router } from 'expo-router';

import MakeConfirmScreen from '@/features/make/components/make-confirm-screen';

export default function MakeConfirmRoute() {
  return <MakeConfirmScreen onMake={() => router.push('/make/generating')} />;
}
