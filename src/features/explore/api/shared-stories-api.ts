import { STORIES_PAGE_SIZE } from '@/features/explore/constants/constellation';
import { request } from '@/lib/api-client';

export type SharedStorySummary = {
  id: string;
  title: string;
  authorName: string;
};

type SharedStoriesPageDto = {
  content: {
    fairytaleId: number;
    title: string;
    authorName: string;
  }[];
  number: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
};

export type SharedStoriesPage = {
  stories: SharedStorySummary[];
  page: number;
  totalPages: number;
  totalElements: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

type Options = {
  page?: number;
  signal?: AbortSignal;
};

export async function fetchSharedStories({
  page = 0,
  signal,
}: Options = {}): Promise<SharedStoriesPage> {
  if (!Number.isInteger(page) || page < 0) {
    throw new Error('페이지 번호는 0 이상의 정수여야 합니다.');
  }

  const params = new URLSearchParams({
    page: String(page),
    size: String(STORIES_PAGE_SIZE),
  });

  const data = await request<SharedStoriesPageDto>(`/api/fairytales/shared?${params.toString()}`, {
    signal,
  });

  return {
    stories: data.content.map((story) => ({
      id: String(story.fairytaleId),
      title: story.title,
      authorName: story.authorName,
    })),
    page: data.number,
    totalPages: data.totalPages,
    totalElements: data.totalElements,
    hasPrevious: !data.first,
    hasNext: !data.last,
  };
}
