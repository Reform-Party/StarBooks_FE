import type { Island } from '@/features/explore/constants/islands';
import type { StorySummary } from '@/features/explore/types/story';
import { request } from '@/lib/api-client';

type ApiIsland = 'FANTASY' | 'MEDIEVAL' | 'TRADITIONAL';

const API_ISLAND: Record<Island['id'], ApiIsland> = {
  fantasy: 'FANTASY',
  medieval: 'MEDIEVAL',
  folktale: 'TRADITIONAL',
};

export const STORIES_PAGE_SIZE = 6;

type FairytaleSummaryDto = {
  fairytaleId: number;
  title: string;
  authorName: string;
};

// 서버의 data 중 목록 화면에서 사용하는 필드입니다.
type MyStoriesPageDto = {
  content: FairytaleSummaryDto[];
  number: number;
  size: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type MyStoriesPage = {
  stories: StorySummary[];
  page: number;
  totalPages: number;
  totalElements: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

type Options = {
  islandId: Island['id'];
  page?: number;
  signal?: AbortSignal;
};

export async function fetchMyStories({
  islandId,
  page = 0,
  signal,
}: Options): Promise<MyStoriesPage> {
  if (!Number.isInteger(page) || page < 0) {
    throw new Error('페이지 번호는 0 이상의 정수여야 합니다.');
  }

  const params = new URLSearchParams({
    island: API_ISLAND[islandId],
    page: String(page),
    size: String(STORIES_PAGE_SIZE),
  });

  const data = await request<MyStoriesPageDto>(`/api/fairytales/my?${params.toString()}`, {
    signal,
  });

  return {
    stories: data.content.map((story) => ({
      id: String(story.fairytaleId),
      title: story.title,
    })),
    page: data.number,
    totalPages: data.totalPages,
    totalElements: data.totalElements,
    hasPrevious: !data.first,
    hasNext: !data.last,
  };
}
