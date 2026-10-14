import { CONSTELLATION_LAYOUT } from '@/features/make/components/constellation';
import { MAKE_STEPS, type MakeSelection } from '@/features/make/constants/story-options';
import type { GenerateRequest } from '@/features/story/api/types';

// 고른 별 세 개와 별자리 모양으로 동화 생성 요청을 만들어요. (빈 칸이 없을 때만 불러요)
export const buildGenerateRequest = (selection: MakeSelection): GenerateRequest => ({
  lessonId: selection.lesson ?? '',
  speciesId: selection.species ?? '',
  backgroundId: selection.background ?? '',
  constellation: {
    stars: MAKE_STEPS.map((s, i) => ({
      key: s.key,
      optionId: selection[s.key] ?? '',
      ...CONSTELLATION_LAYOUT[i],
    })),
  },
});
