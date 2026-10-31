import { create } from 'zustand';

import { onSignOut } from '@/features/auth/store/auth-store';
import { generateStory } from '@/features/story/api/story-api';
import type { GenerateRequest, StoryEvent, StoryMeta, StoryPage } from '@/features/story/api/types';
import { ApiError, notifyUnauthorized } from '@/lib/api-client';
import { queryClient } from '@/lib/query-client';

export type GenerationStatus = 'idle' | 'connecting' | 'streaming' | 'ready' | 'done' | 'error';

type GenerationData = {
  status: GenerationStatus;
  // 지금(또는 마지막으로) 보낸 요청. 같은 선택인지 비교하고, 다시 시도할 때 써요.
  request: GenerateRequest | null;
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
  request: null,
  storyId: null,
  totalPages: 0,
  meta: null,
  pages: [],
  error: null,
};

const FALLBACK_ERROR = '동화를 만들지 못했어요';

// 스트림 중간에 토큰이 만료되면 error 이벤트로만 와요. (코드 이름은 BE 명세가 확정되면 맞춰요)
const UNAUTHORIZED_CODES = new Set(['UNAUTHORIZED', 'TOKEN_EXPIRED', 'HTTP_401']);

// 같은 별 세 개를 골랐는지
export const isSameSelection = (a: GenerateRequest, b: GenerateRequest) =>
  a.lessonId === b.lessonId && a.speciesId === b.speciesId && a.backgroundId === b.backgroundId;

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
    case 'done': {
      const { pages } = e.data.story;
      // 최종 쪽수가 처음 알려 준 것과 달라도 "다음" 이 "쓰는 중…" 으로 남지 않게 맞춰요.
      return { status: 'done', pages, totalPages: pages.length };
    }
    case 'error':
      return { status: 'error', error: e.data.message ?? FALLBACK_ERROR };
  }
}

// 지금 이어지고 있는 스트림. 새로 시작하거나 비우면 끊어요.
let controller: AbortController | null = null;

// 동화 생성(SSE) 상태. 생성 중 → 동화 프레임으로 화면이 바뀌어도 스트림이 끊기지 않도록
// 화면이 아니라 전역 스토어가 스트림을 들고 있어요.
export const useGenerationStore = create<GenerationState>()((set, get) => ({
  ...INITIAL,

  start: async (request) => {
    controller?.abort();
    const current = new AbortController();
    controller = current;
    set({ ...INITIAL, status: 'connecting', request });

    // 취소된 작업(새로 시작 · reset)은 아래 어디서도 상태를 건드리지 않아요.
    // expo/fetch 는 연결 중에 취소하면 AbortError 가 아닌 오류를 던져서, 오류 이름 대신 signal 로 판단해요.
    let finished = false;
    try {
      await generateStory(request, {
        signal: current.signal,
        onEvent: (e) => {
          if (current.signal.aborted) return;
          if (e.event === 'error' && e.data.code && UNAUTHORIZED_CODES.has(e.data.code)) {
            notifyUnauthorized();
          }
          // 다 만든 동화는 캐시에 넣어 같은 id 를 다시 열 때 재요청하지 않아요.
          if (e.event === 'done')
            queryClient.setQueryData(['story', e.data.story.id], e.data.story);
          if (e.event === 'done' || e.event === 'error') finished = true;
          set(reduce(get(), e));
        },
      });
      if (current.signal.aborted) return;
      if (!finished) set({ status: 'error', error: '연결이 끊어졌어요. 다시 시도해 주세요' });
    } catch (e) {
      if (current.signal.aborted) return;
      // 읽기 도중 실패해도 연결이 남지 않게 닫아요. (iOS 는 reader.cancel() 만으로 요청이 닫히지 않아요)
      current.abort();
      // TypeError 같은 내부 문구가 아이 화면에 보이지 않게, 서버 · 네트워크 오류 문구만 보여 줘요.
      set({ status: 'error', error: e instanceof ApiError ? e.message : FALLBACK_ERROR });
    } finally {
      if (controller === current) controller = null;
    }
  },

  retry: () => {
    const { request } = get();
    if (request) void get().start(request);
  },

  reset: () => {
    controller?.abort();
    controller = null;
    set(INITIAL);
  },
}));

// 로그아웃하면 만들던 동화도 끊고 비워요.
onSignOut(() => useGenerationStore.getState().reset());
