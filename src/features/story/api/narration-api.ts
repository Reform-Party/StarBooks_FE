import { isNumericStoryId } from '@/features/story/api/story-api';
import type { StoryPage } from '@/features/story/api/types';
import { request } from '@/lib/api-client';

export async function fetchNarration(page: StoryPage, signal?: AbortSignal): Promise<StoryPage> {
  // 상세 응답이 제공한 파일은 문단 ID 없이도 바로 재생할 수 있어요.
  if (page.ttsUrl) return page;
  if (!page.paragraphId) {
    // 현재 상세 명세에는 paragraphId가 없어요. 페이지 번호로 대체하지 않아요.
    return page;
  }
  const path = `/api/users/voice/${page.paragraphId}`;
  let exists = false;
  const available = await request<boolean | undefined>(`${path}/check`, {
    signal,
    verifySessionOnUnauthorized: true,
    onStatus: (status) => {
      exists = status === 200;
    },
  });
  // 응답 봉투의 data:false도 존중해요. 본문 없는 HTTP 204는 위 상태로 판정해요.
  if (typeof available === 'boolean') exists = available;
  if (!exists) return { ...page, ttsUrl: null };
  const data = await request<{ paragraphId: number; ttsUrl: string }>(path, {
    signal,
    verifySessionOnUnauthorized: true,
  });
  if (data.paragraphId !== page.paragraphId || !data.ttsUrl) {
    throw new Error('음성 파일 응답을 확인할 수 없어요.');
  }
  return { ...page, ttsUrl: data.ttsUrl };
}

// 생성 성공 응답만으로 완료를 판단하지 않고 문단별 check/상세 URL로 확인해요.
export async function requestNarration(id: string): Promise<number> {
  if (!isNumericStoryId(id)) throw new Error('동화 번호가 올바르지 않아요.');
  await request<void>(`/api/users/voice/${encodeURIComponent(id)}`, {
    method: 'POST',
    verifySessionOnUnauthorized: true,
  });
  return Date.now();
}
