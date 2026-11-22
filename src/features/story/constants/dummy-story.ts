import { Image } from 'react-native';

import { BACKGROUNDS, findOption, LESSONS, SPECIES } from '@/features/make/constants/story-options';
import type { GenerateRequest, Story } from '@/features/story/api/types';

// 동화 생성 서버가 실패하거나 너무 늦을 때 대신 보여 주는 더미 동화예요.
// (백엔드 SSE · 삽화가 안정되면 이 대체는 빼도 돼요)
export const DUMMY_STORY_ID = 'dummy';

// 삽화가 아직 없어서 밤하늘 배경을 그림 자리에 써요.
const DUMMY_IMAGE =
  Image.resolveAssetSource(require('@/assets/images/night-sky.webp'))?.uri ?? null;

export function buildDummyStory(request: GenerateRequest): Story {
  const lesson = findOption(LESSONS, request.morality)?.label ?? '소중한 마음';
  const species = findOption(SPECIES, request.charSpecies)?.label ?? '친구';
  const background = findOption(BACKGROUNDS, request.background)?.label ?? '별나라';

  const sentences = [
    [
      `${background}에 작은 ${species} 친구가 살고 있었어요.`,
      '밤마다 하늘의 별을 세며 잠이 들었지요.',
    ],
    [
      '어느 날, 반짝이는 별 하나가 친구 앞에 내려왔어요.',
      `"나와 함께 '${lesson}' 여행을 떠나 볼래?"`,
    ],
    [
      '친구는 별과 함께 이곳저곳을 다니며 많은 이웃을 만났어요.',
      '조금 어려운 일도 있었지만 포기하지 않았어요.',
    ],
    [
      `여행을 마친 친구는 '${lesson}'의 뜻을 알게 되었어요.`,
      '그날 밤, 하늘에는 새로운 별자리가 하나 생겼답니다.',
    ],
  ];

  return {
    id: DUMMY_STORY_ID,
    title: `${species} 친구의 별빛 여행`,
    pages: sentences.map((s, i) => ({
      page: i + 1,
      text: s.join('\n'),
      sentences: s,
      imageUrl: DUMMY_IMAGE,
    })),
  };
}
