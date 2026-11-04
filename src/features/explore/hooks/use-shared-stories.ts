import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { fetchSharedStories } from '@/features/explore/api/shared-stories-api';
import { API_URL } from '@/lib/api-client';

export function useSharedStories(page: number) {
  return useQuery({
    queryKey: ['explore', 'shared-stories', page],
    queryFn: ({ signal }) =>
      fetchSharedStories({
        page,
        signal,
      }),
    enabled: Boolean(API_URL),
    retry: false,
    placeholderData: keepPreviousData,
    gcTime: 0,
  });
}
