import { type SseMessage, streamSse } from '@/features/story/api/sse-client';
import type { GenerateRequest, PageContent, Story, StoryEvent } from '@/features/story/api/types';
import { ApiError, request } from '@/lib/api-client';

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null;
const isStr = (v: unknown): v is string => typeof v === 'string';

const isPageContent = (v: unknown): v is PageContent =>
  isObj(v) &&
  typeof v.pageNo === 'number' &&
  Number.isInteger(v.pageNo) &&
  v.pageNo >= 1 &&
  Array.isArray(v.text) &&
  v.text.every(isStr) &&
  (v.imageUrl == null || isStr(v.imageUrl)) &&
  (v.vocab == null || (isObj(v.vocab) && isStr(v.vocab.word) && isStr(v.vocab.meaning)));

// 명세 글에는 page-content, 서버 예시 화면에는 page_content 라서 둘 다 받아요.
const PAGE_EVENTS = new Set(['page_content', 'page-content']);

// 모르는 이벤트 · 형식이 맞지 않는 쪽은 null(건너뜀)이에요. 빠진 쪽은 다시 연결할 때 동화 조회로 채워요.
export function toStoryEvent(m: SseMessage): StoryEvent | null {
  if (m.event === 'connect') return { event: 'connect' };
  if (m.event === 'done') return { event: 'done' };
  if (!PAGE_EVENTS.has(m.event) || !isPageContent(m.data)) return null;
  const { vocab = null, imageUrl = null } = m.data;
  return { event: 'page', data: { ...m.data, vocab, imageUrl } };
}

// 동화 만들기. 성공하면 만든 동화 id 를 돌려줘요. (data: 9)
export async function createFairytale(body: GenerateRequest, signal?: AbortSignal) {
  const id = await request<unknown>('/api/fairytales', {
    method: 'POST',
    body,
    signal,
    timeoutMs: 30_000,
  });
  if (typeof id !== 'number' || !Number.isInteger(id) || id < 1) {
    throw new ApiError(0, 'BAD_RESPONSE', '동화를 만들지 못했어요');
  }
  return String(id);
}

type SubscribeOptions = {
  signal?: AbortSignal;
  onEvent: (event: StoryEvent) => void;
};

// 만든 동화의 내용을 SSE 로 받아요. 서버가 done 을 보내거나 연결이 끊기면 끝나요.
export const subscribeStory = (id: string, { signal, onEvent }: SubscribeOptions) =>
  streamSse(`/api/fairytales/${encodeURIComponent(id)}/sse`, {
    signal,
    onMessage: (m) => {
      const event = toStoryEvent(m);
      if (event) onEvent(event);
    },
  });

// id 는 딥링크(starbooks://story/...)로도 들어오고 디코딩된 채 넘어와서, 형식이 맞을 때만 요청해요.
const STORY_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
export const isValidStoryId = (id: unknown): id is string => isStr(id) && STORY_ID_RE.test(id);

export const isNumericStoryId = (id: unknown): id is string =>
  typeof id === 'string' && /^[1-9]\d*$/.test(id);

type FairytaleDetailDto = {
  fairytaleId: number;
  title: string;
  authorName: string;
  paragraphs: {
    paragraphId?: number;
    page: number;
    sentences: string[];
    imageUrl: string | null;
    ttsUrl?: string | null;
  }[];
  vocab: {
    wordEntryId: number;
    pageNo: number;
    word: string;
    meaning: string;
  }[];
};

export async function fetchStory(id: string, signal?: AbortSignal): Promise<Story> {
  if (!isNumericStoryId(id)) {
    throw new Error('동화 번호가 올바르지 않아요.');
  }

  const data = await request<FairytaleDetailDto>(`/api/fairytales/${encodeURIComponent(id)}`, {
    signal,
    verifySessionOnUnauthorized: true,
  });

  return {
    id: String(data.fairytaleId),
    title: data.title,
    authorName: data.authorName,
    pages: data.paragraphs.map((paragraph) => ({
      paragraphId: paragraph.paragraphId,
      page: paragraph.page,
      text: paragraph.sentences.join('\n'),
      sentences: paragraph.sentences,
      imageUrl: paragraph.imageUrl,
      ttsUrl: paragraph.ttsUrl ?? null,
    })),
    vocab: data.vocab.map((entry) => ({
      wordEntryId: entry.wordEntryId,
      pageNo: entry.pageNo,
      word: entry.word,
      meaning: entry.meaning,
    })),
  };
}
