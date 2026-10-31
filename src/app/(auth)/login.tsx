import { useLocalSearchParams } from 'expo-router';

import LoginScreen from '@/features/auth/components/login-screen';

export default function LoginRoute() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  // 가입을 마치고 돌아오면 화면은 그대로이고 params 만 바뀌어요.
  // key 로 다시 그려서 이메일을 채우고, 비밀번호 칸 · 실패 횟수도 비워요.
  return <LoginScreen key={email} initialEmail={email} />;
}
