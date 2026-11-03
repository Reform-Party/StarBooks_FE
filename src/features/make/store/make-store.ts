import { create } from 'zustand';

import type { MakeKey, MakeSelection } from '@/features/make/constants/story-options';

const EMPTY: MakeSelection = { lesson: null, species: null, background: null };

type MakeState = {
  selection: MakeSelection;
  // 같은 단계에서 다른 별을 고르면 바꿔 끼워요. (여러 개 고르기 없음) null 이면 비워요.
  select: (key: MakeKey, id: string | null) => void;
  reset: () => void;
};

// 동화 만들기 1 ~ 3 단계와 별자리 확인 · 생성 화면이 같이 보는 선택 상태
export const useMakeStore = create<MakeState>()((set) => ({
  selection: EMPTY,
  select: (key, id) => set((s) => ({ selection: { ...s.selection, [key]: id } })),
  reset: () => set({ selection: EMPTY }),
}));
