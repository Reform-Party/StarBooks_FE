import type { LoginBody, LoginData, SignupBody, User, UserData } from '@/features/auth/api/types';
import { ApiError, request, setAccessToken } from '@/lib/api-client';

// 지금은 이메일 로그인만 실제로 동작해요. (카카오 · Google · Apple 은 버튼만 있어요)
export async function login(body: LoginBody): Promise<User> {
  const data = await request<LoginData>('/api/auth/login', { method: 'POST', body });
  const token = data.accessToken ?? data.token;
  if (!token) throw new ApiError(500, 'NO_TOKEN', '로그인하지 못했어요. 다시 시도해 주세요');
  await setAccessToken(token);
  return data.user;
}

export const signup = (body: SignupBody) =>
  request<UserData>('/api/auth/signup', { method: 'POST', body });

export async function fetchMe(): Promise<User> {
  const { user } = await request<UserData>('/api/auth/me');
  return user;
}

export const logout = () => setAccessToken(null);
