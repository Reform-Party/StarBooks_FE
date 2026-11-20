import { request } from '@/lib/api-client';

// 202 응답은 접수만 뜻해요. 완료 여부는 동화 상세의 ttsUrl로 확인해요.
export async function requestNarration(id: string): Promise<number> {
  if (!/^[1-9]\d*$/.test(id)) throw new Error('동화 번호가 올바르지 않아요.');
  await request<void>(`/api/users/voice/${encodeURIComponent(id)}`, { method: 'POST' });
  return Date.now();
}
