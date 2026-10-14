import { create } from 'zustand';

import { fetchMe, logout } from '@/features/auth/api/auth-api';
import type { User } from '@/features/auth/api/types';
import { ApiError, getAccessToken } from '@/lib/api-client';

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

export const useAuthStore = create<AuthState>()((set) => ({
  status: 'loading',
  user: null,

  restore: async () => {
    const token = await getAccessToken();
    if (!token) {
      set({ status: 'guest' });
      return;
    }
    try {
      set({ status: 'authed', user: await fetchMe() });
    } catch (e) {
      // 토큰이 만료됐을 때만 지워요. 서버에 잠깐 못 닿은 경우엔 다음에 다시 써요.
      if (e instanceof ApiError && e.status === 401) await logout();
      set({ status: 'guest', user: null });
    }
  },

  signIn: (user) => set({ status: 'authed', user }),

  signOut: async () => {
    await logout();
    set({ status: 'guest', user: null });
  },
}));
