import type { MakeSelection } from '@/features/make/constants/story-options';
import type { GenerateRequest } from '@/features/story/api/types';

// 고른 별 세 개로 동화 만들기 요청을 만들어요. (빈 칸이 없을 때만 불러요)
export const buildGenerateRequest = (selection: MakeSelection): GenerateRequest => ({
  background: selection.background ?? '',
  charSpecies: selection.species ?? '',
  morality: selection.lesson ?? '',
});
