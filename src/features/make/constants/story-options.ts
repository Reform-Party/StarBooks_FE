import type { StarColor } from '@/constants/colors';

// 동화 만들기 선택지. 교훈 12 · 주인공 종 3 · 배경 8 중에서 각각 꼭 하나씩 골라요.
// 순서는 Figma 와이어프레임의 별 배치 순서예요.
// id 는 API 명세 "동화 만들기" 의 열거형 값이에요. (교훈 morality · 주인공 charSpecies · 배경 background)

export type StoryOption = { id: string; label: string };

export const LESSONS = [
  { id: 'KINDNESS_REWARDED', label: '착한 마음씨' },
  { id: 'NO_GREED', label: '양보하기' },
  { id: 'PERSEVERANCE', label: '포기하지 않기' },
  { id: 'USE_WISDOM', label: '지혜로운 생각' },
  { id: 'SELF_WORTH', label: '소중한 나' },
  { id: 'COURAGE', label: '용기 내기' },
  { id: 'LOVE_NATURE', label: '자연 사랑하기' },
  { id: 'KEEP_PROMISE', label: '약속 지키기' },
  { id: 'NO_LYING', label: '솔직한 마음' },
  { id: 'RESPECT_DIFF', label: '다름을 인정하기' },
  { id: 'OBEY_ELDERS', label: '말씀 잘 듣기' },
  { id: 'COOPERATION', label: '힘을 합쳐요' },
] as const satisfies readonly StoryOption[];

export const SPECIES = [
  { id: 'HUMAN', label: '사람' },
  { id: 'ANIMAL', label: '동물' },
  { id: 'ETC', label: '기타' },
] as const satisfies readonly StoryOption[];

export const BACKGROUNDS = [
  { id: 'KOREAN_TRADITIONAL', label: '한국 전통' },
  { id: 'UNDERWATER', label: '바닷속' },
  { id: 'FANTASY_WORLD', label: '판타지 세계' },
  { id: 'SKY_HEAVEN', label: '하늘' },
  { id: 'MIXED', label: '혼합' },
  { id: 'MODERN_FANTASY', label: '현대 판타지' },
  { id: 'EUROPEAN_MEDIEVAL', label: '중세 유럽' },
  { id: 'FOREST_NATURE', label: '자연' },
] as const satisfies readonly StoryOption[];

export type MakeKey = 'lesson' | 'species' | 'background';

export type MakeSelection = Record<MakeKey, string | null>;

export type MakeStep = {
  key: MakeKey;
  // 이 단계 화면 주소
  href: '/make/lesson' | '/make/hero' | '/make/background';
  starLabel: string;
  // 별 색의 뜻 — 노랑: 교훈 / 민트: 주인공 / 보라: 배경
  tone: StarColor;
  title: string;
  options: readonly StoryOption[];
  missingMessage: string;
};

// 별 3칸(교훈 → 주인공 → 배경)과 만들기 단계
export const MAKE_STEPS: readonly MakeStep[] = [
  {
    key: 'lesson',
    href: '/make/lesson',
    starLabel: '교훈',
    tone: 'yellow',
    title: '어떤 교훈을 담은 동화를 만들까요?',
    options: LESSONS,
    missingMessage: '교훈 별을 하나 골라 주세요',
  },
  {
    key: 'species',
    href: '/make/hero',
    starLabel: '주인공',
    tone: 'mint',
    title: '누가 주인공이 될까요?',
    options: SPECIES,
    missingMessage: '주인공 별을 하나 골라 주세요',
  },
  {
    key: 'background',
    href: '/make/background',
    starLabel: '배경',
    tone: 'purple',
    title: '어디를 배경으로 할까요?',
    options: BACKGROUNDS,
    missingMessage: '배경 별을 하나 골라 주세요',
  },
];

export const findOption = (options: readonly StoryOption[], id: string | null) =>
  options.find((o) => o.id === id) ?? null;

// 아직 고르지 않은 단계 (선택 확인 · 생성 전에 확인해요)
export const missingSteps = (selection: MakeSelection) =>
  MAKE_STEPS.filter((s) => !findOption(s.options, selection[s.key]));
