import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// 서버에 필드가 없어서 계정마다 기기에 두는 프로필 값. (성별 · 나이는 서버 마이페이지 API 에 저장해요)
export type LocalProfile = {
  // 앨범에서 고른 사진의 문서 폴더 속 파일 이름. null 이면 기본 프로필로 바꾼 거예요.
  // 앱 업데이트로 컨테이너 경로가 바뀔 수 있어 절대 경로 대신 이름만 저장해요.
  photoFile?: string | null;
};

type SettingsState = {
  // 효과음 · 배경음악은 계정이 아니라 기기 설정이에요.
  sfx: boolean;
  bgm: boolean;
  profiles: Record<string, LocalProfile>;
  setSfx: (on: boolean) => void;
  setBgm: (on: boolean) => void;
  setPhotoFile: (userId: string, photoFile: string | null) => void;
};

type PersistedSettings = Pick<SettingsState, 'sfx' | 'bgm' | 'profiles'>;

// v0 은 성별 · 나이도 기기에 덮어썼어요. 서버 값을 가리지 않게 사진만 남겨요.
function dropServerProfileFields(state: PersistedSettings): PersistedSettings {
  const profiles: Record<string, LocalProfile> = {};
  for (const [userId, p] of Object.entries(state.profiles ?? {})) {
    if (p.photoFile !== undefined) profiles[userId] = { photoFile: p.photoFile };
  }
  return { ...state, profiles };
}

function migrate(persisted: unknown, version: number): PersistedSettings {
  let state = persisted as PersistedSettings;
  if (version < 1) state = dropServerProfileFields(state);
  // v1 까지는 배경음악이 없어서 저장된 bgm 은 예전 기본값(false)이에요. 처음엔 켜진 채로 들려줘요.
  if (version < 2) state = { ...state, bgm: true };
  return state;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      sfx: true,
      bgm: true,
      profiles: {},
      setSfx: (sfx) => set({ sfx }),
      setBgm: (bgm) => set({ bgm }),
      setPhotoFile: (userId, photoFile) =>
        set((s) => ({
          profiles: { ...s.profiles, [userId]: { ...s.profiles[userId], photoFile } },
        })),
    }),
    {
      name: 'settings',
      version: 2,
      migrate,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ sfx, bgm, profiles }) => ({ sfx, bgm, profiles }),
    },
  ),
);
