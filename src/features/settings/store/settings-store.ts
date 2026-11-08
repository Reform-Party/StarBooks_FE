import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Gender } from '@/features/auth/api/types';

// 서버에 저장하기 전까지 계정마다 기기에 덮어써 두는 프로필 값.
// API 가 연결되면 성별 · 나이 · 사진은 서버 값으로 옮기고 여기서는 뺄 거예요.
export type ProfileOverride = {
  gender?: Gender;
  age?: number;
  // 앨범에서 고른 사진. null 이면 기본 프로필로 바꾼 거예요.
  photoUri?: string | null;
};

type SettingsState = {
  // 효과음 · 배경음악은 계정이 아니라 기기 설정이에요.
  sfx: boolean;
  bgm: boolean;
  profiles: Record<string, ProfileOverride>;
  setSfx: (on: boolean) => void;
  setBgm: (on: boolean) => void;
  updateProfile: (userId: string, patch: ProfileOverride) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      sfx: true,
      bgm: false,
      profiles: {},
      setSfx: (sfx) => set({ sfx }),
      setBgm: (bgm) => set({ bgm }),
      updateProfile: (userId, patch) =>
        set((s) => ({
          profiles: { ...s.profiles, [userId]: { ...s.profiles[userId], ...patch } },
        })),
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ sfx, bgm, profiles }) => ({ sfx, bgm, profiles }),
    },
  ),
);
