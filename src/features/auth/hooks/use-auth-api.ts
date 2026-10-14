import { useMutation } from '@tanstack/react-query';

import { login, signup } from '@/features/auth/api/auth-api';
import { useAuthStore } from '@/features/auth/store/auth-store';

// 로그인에 성공하면 로그인 상태로 바꿔요. 화면 이동은 루트 레이아웃의 가드가 맡아요.
export function useLogin() {
  const signIn = useAuthStore((s) => s.signIn);
  return useMutation({ mutationFn: login, onSuccess: signIn });
}

export function useSignup() {
  return useMutation({ mutationFn: signup });
}
