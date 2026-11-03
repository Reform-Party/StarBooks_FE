import { create } from 'zustand';

import { fetchMe, logout } from '@/features/auth/api/auth-api';
import type { User } from '@/features/auth/api/types';
import { useSignupDraftStore } from '@/features/auth/store/signup-draft-store';
import { ApiError, getAccessToken, setUnauthorizedHandler } from '@/lib/api-client';
import { queryClient } from '@/lib/query-client';

// loading: 저장된 토큰 확인 중 / guest: 로그인 전 / authed: 로그인 됨
export type AuthStatus = 'loading' | 'guest' | 'authed';

type AuthState = {
  status: AuthStatus;
  user: User | null;
  // 앱을 켤 때 저장된 토큰으로 로그인 상태를 되살려요.
  restore: () => Promise<void>;
  signIn: (user: User) => void;
  signOut: () => Promise<void>;
};

// 로그아웃할 때 함께 비울 것들. 다른 기능의 스토어가 등록해요. (auth 가 그 스토어를 import 하지 않게)
const signOutCleanups = new Set<() => void>();
export function onSignOut(fn: () => void) {
  signOutCleanups.add(fn);
  return () => {
    signOutCleanups.delete(fn);
  };
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: 'loading',
  user: null,

  // 어떤 경우에도 guest / authed 로 끝나서 스플래시에 멈추지 않아요.
  restore: async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        set({ status: 'guest' });
        return;
      }
      set({ status: 'authed', user: await fetchMe() });
    } catch (e) {
      // 토큰이 만료됐을 때만 지워요. 서버에 잠깐 못 닿은 경우엔 다음에 다시 써요.
      if (e instanceof ApiError && e.status === 401) await logout().catch(() => undefined);
      set({ status: 'guest', user: null });
    }
  },

  signIn: (user) => {
    // 가입을 마치지 않고 기존 계정으로 로그인해도 비밀번호 초안이 남지 않게 지워요.
    useSignupDraftStore.getState().clear();
    set({ status: 'authed', user });
  },

  signOut: async () => {
    await logout().catch(() => undefined);
    signOutCleanups.forEach((fn) => fn());
    // 같은 기기에서 다른 계정으로 로그인해도 이전 계정의 캐시가 보이지 않게 비워요.
    queryClient.clear();
    set({ status: 'guest', user: null });
  },
}));

// 쓰는 도중 토큰이 만료되면(401) 로그아웃시켜요. 화면 이동은 _layout 의 가드가 해요.
setUnauthorizedHandler(() => {
  if (useAuthStore.getState().status === 'authed') void useAuthStore.getState().signOut();
});
