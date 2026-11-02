import { create } from 'zustand';

type Account = { email: string; password: string };

type SignupDraftState = {
  account: Account | null;
  setAccount: (account: Account) => void;
  clear: () => void;
};

// 회원가입 1 / 2 에서 적은 계정을 2 / 2 로 넘겨요.
// 비밀번호가 주소(파라미터)나 저장소에 남지 않도록 메모리에만 두고, 가입을 마치면 지워요.
export const useSignupDraftStore = create<SignupDraftState>()((set) => ({
  account: null,
  setAccount: (account) => set({ account }),
  clear: () => set({ account: null }),
}));
