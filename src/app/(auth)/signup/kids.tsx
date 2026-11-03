import { Redirect } from 'expo-router';
import { useState } from 'react';

import SignupKidsScreen from '@/features/auth/components/signup-kids-screen';
import { useSignupDraftStore } from '@/features/auth/store/signup-draft-store';

export default function SignupKidsRoute() {
  // 처음 값만 써요. 가입을 마치고 초안을 지워도, 나가는 동안 1 / 2 로 튕기지 않아요.
  const [account] = useState(() => useSignupDraftStore.getState().account);
  // 계정 단계를 건너뛰고 바로 들어오면 1 / 2 로 돌려보내요.
  if (!account) return <Redirect href="/signup" />;
  return <SignupKidsScreen account={account} />;
}
