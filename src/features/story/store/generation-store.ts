import { create } from 'zustand';

import { generateStory } from '@/features/story/api/story-api';
import type { GenerateRequest, StoryEvent, StoryMeta, StoryPage } from '@/features/story/api/types';
import { isAbortError } from '@/lib/api-client';

export type GenerationStatus = 'idle' | 'connecting' | 'streaming' | 'ready' | 'done' | 'error';

type GenerationData = {
  status: GenerationStatus;
  storyId: string | null;
  totalPages: number;
  meta: StoryMeta | null;
  pages: StoryPage[];
  error: string | null;
};

type GenerationState = GenerationData & {
  start: (request: GenerateRequest) => Promise<void>;
  retry: () => void;
  reset: () => void;
};

const INITIAL: GenerationData = {
  status: 'idle',
  storyId: null,
  totalPages: 0,
  meta: null,
  pages: [],
  error: null,
};

const FALLBACK_ERROR = '동화를 만들지 못했어요';

// 페이지 배열을 page 쪽까지 늘려요.
function ensurePages(pages: StoryPage[], count: number) {
  const next = pages.slice();
  while (next.length < count) next.push({ page: next.length + 1, text: '', imageUrl: null });
  return next;
}

function updatePage(pages: StoryPage[], page: number, patch: (p: StoryPage) => Partial<StoryPage>) {
  const next = ensurePages(pages, page);
  next[page - 1] = { ...next[page - 1], ...patch(next[page - 1]) };
  return next;
}

function reduce(state: GenerationData, e: StoryEvent): Partial<GenerationData> {
  switch (e.event) {
    case 'started':
      return {
        status: 'streaming',
        storyId: e.data.storyId,
        totalPages: e.data.totalPages,
        pages: ensurePages([], e.data.totalPages),
      };
    case 'meta':
      return { meta: e.data };
    case 'text':
      return {
        pages: updatePage(state.pages, e.data.page, (p) => ({ text: p.text + e.data.delta })),
      };
    case 'image':
      return { pages: updatePage(state.pages, e.data.page, () => ({ imageUrl: e.data.url })) };
    case 'ready':
      return state.status === 'streaming' ? { status: 'ready' } : {};
    case 'done':
      return { status: 'done', pages: e.data.story.pages ?? state.pages };
    case 'error':
      return { status: 'error', error: e.data.message ?? FALLBACK_ERROR };
  }
}

// 지금 이어지고 있는 스트림. 새로 시작하거나 비우면 끊어요.
let controller: AbortController | null = null;
let lastRequest: GenerateRequest | null = null;

// 동화 생성(SSE) 상태. 생성 중 → 동화 프레임으로 화면이 바뀌어도 스트림이 끊기지 않도록
// 화면이 아니라 전역 스토어가 스트림을 들고 있어요.
export const useGenerationStore = create<GenerationState>()((set, get) => ({
  ...INITIAL,

  start: async (request) => {
    controller?.abort();
    const current = new AbortController();
    controller = current;
    lastRequest = request;
    set({ ...INITIAL, status: 'connecting' });

    let finished = false;
    try {
      await generateStory(request, {
        signal: current.signal,
        onEvent: (e) => {
          if (e.event === 'done' || e.event === 'error') finished = true;
          set(reduce(get(), e));
        },
      });
      if (!finished) set({ status: 'error', error: '연결이 끊어졌어요. 다시 시도해 주세요' });
    } catch (e) {
      if (isAbortError(e)) return;
      set({ status: 'error', error: e instanceof Error ? e.message : FALLBACK_ERROR });
    } finally {
      if (controller === current) controller = null;
    }
  },

  retry: () => {
    if (lastRequest) get().start(lastRequest);
  },

  reset: () => {
    controller?.abort();
    controller = null;
    set(INITIAL);
  },
}));
