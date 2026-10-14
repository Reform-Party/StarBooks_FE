import { Redirect } from 'expo-router';

import SignupKidsScreen from '@/features/auth/components/signup-kids-screen';
import { useSignupDraftStore } from '@/features/auth/store/signup-draft-store';

export default function SignupKidsRoute() {
  const account = useSignupDraftStore((s) => s.account);
  // 계정 단계를 건너뛰고 바로 들어오면 1 / 2 로 돌려보내요.
  if (!account) return <Redirect href="/signup" />;
  return <SignupKidsScreen account={account} />;
}
