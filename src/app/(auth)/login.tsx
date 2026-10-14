import { useLocalSearchParams } from 'expo-router';

import LoginScreen from '@/features/auth/components/login-screen';

export default function LoginRoute() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  return <LoginScreen initialEmail={email} />;
}
