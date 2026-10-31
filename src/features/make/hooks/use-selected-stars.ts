import type { ConstellationStar } from '@/features/make/constants/constellation';
import { findOption, MAKE_STEPS } from '@/features/make/constants/story-options';
import { useMakeStore } from '@/features/make/store/make-store';

// 별자리에 그릴 세 별 (교훈 · 주인공 · 배경 순서, 고른 이름과 색)
export function useSelectedStars(): ConstellationStar[] {
  const selection = useMakeStore((s) => s.selection);
  return MAKE_STEPS.map((s) => ({
    label: s.starLabel,
    tone: s.tone,
    value: findOption(s.options, selection[s.key])?.label ?? '',
  }));
}
