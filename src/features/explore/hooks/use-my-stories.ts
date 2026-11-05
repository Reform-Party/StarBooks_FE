import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { fetchMyStories } from '@/features/explore/api/my-stories-api';
import type { Island } from '@/features/explore/constants/islands';
import { API_URL } from '@/lib/api-client';

export function useMyStories(islandId: Island['id'], page: number) {
  return useQuery({
    queryKey: ['explore', 'my-stories', islandId, page],
    queryFn: ({ signal }) =>
      fetchMyStories({
        islandId,
        page,
        signal,
      }),
    enabled: Boolean(API_URL),
    retry: false,
    placeholderData: keepPreviousData,
    gcTime: 0,
  });
}
