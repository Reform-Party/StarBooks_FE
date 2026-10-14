import { router } from 'expo-router';

import MakeConfirmScreen from '@/features/make/components/make-confirm-screen';

export default function MakeConfirmRoute() {
  // 동화 생성 화면이 들어오면 그쪽으로 이어요. (다음 PR)
  return <MakeConfirmScreen onMake={() => router.dismissTo('/')} />;
}
