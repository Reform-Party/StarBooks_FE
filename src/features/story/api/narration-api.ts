import { isNumericStoryId } from '@/features/story/api/story-api';
import type { StoryPage } from '@/features/story/api/types';
import { request } from '@/lib/api-client';

export async function fetchNarration(page: StoryPage, signal?: AbortSignal): Promise<StoryPage> {
  if (!page.paragraphId) {
    if (page.ttsUrl) return page;
    throw new Error('동화 응답에 문단 번호가 없어 음성을 확인할 수 없어요.');
  }
  const path = `/api/users/voice/${page.paragraphId}`;
  let exists = false;
  await request<void>(`${path}/check`, {
    signal,
    onStatus: (status) => {
      exists = status === 200;
    },
  });
  if (!exists) return { ...page, ttsUrl: null };
  const data = await request<{ paragraphId: number; ttsUrl: string }>(path, { signal });
  if (data.paragraphId !== page.paragraphId || !data.ttsUrl) {
    throw new Error('음성 파일 응답을 확인할 수 없어요.');
  }
  return { ...page, ttsUrl: data.ttsUrl };
}

// 202는 접수만 뜻하며 문단별 check로 완료를 확인해요.
export async function requestNarration(id: string): Promise<number> {
  if (!isNumericStoryId(id)) throw new Error('동화 번호가 올바르지 않아요.');
  await request<void>(`/api/users/voice/${encodeURIComponent(id)}`, { method: 'POST' });
  return Date.now();
}
