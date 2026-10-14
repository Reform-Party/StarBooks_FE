import { skipToken, useQuery } from '@tanstack/react-query';

import { fetchStory } from '@/features/story/api/story-api';

// 이미 저장된 동화를 불러와요. (지금 만들고 있는 동화면 id 를 null 로 넘겨 요청하지 않아요)
export function useStory(id: string | null) {
  return useQuery({
    queryKey: ['story', id],
    queryFn: id == null ? skipToken : () => fetchStory(id),
  });
}
