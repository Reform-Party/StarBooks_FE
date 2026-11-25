import { create } from 'zustand';

import { onSignOut } from '@/features/auth/store/auth-store';
import { createFairytale, fetchStory, subscribeStory } from '@/features/story/api/story-api';
import type {
  GenerateRequest,
  PageContent,
  Story,
  StoryMeta,
  StoryPage,
} from '@/features/story/api/types';
import { ApiError } from '@/lib/api-client';
import { queryClient } from '@/lib/query-client';

// connecting: 동화 만들기 요청 ~ 준비 전 / ready: 첫 3쪽이 와서 읽기 화면으로 / done: 다 만듦
export type GenerationStatus = 'idle' | 'connecting' | 'ready' | 'done' | 'error';

type GenerationData = {
  status: GenerationStatus;
  // 지금(또는 마지막으로) 보낸 요청. 같은 선택인지 비교하고, 다시 시도할 때 써요.
  request: GenerateRequest | null;
  storyId: string | null;
  // 서버가 전체 쪽수를 미리 알려 주지 않아서, 만드는 중에는 "받은 쪽 + 1" 로 다음 쪽을 기다려요.
  totalPages: number;
  meta: StoryMeta | null;
  pages: StoryPage[];
  error: string | null;
  retryAction: 'retry' | 'bookshelf';
  receivedDone: boolean;
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
  retryAction: 'retry',
  receivedDone: false,
};

const FALLBACK_ERROR = '동화를 만들지 못했어요';

// 서버 작업과 별개로 한 번의 결과 확인은 10분까지만 기다려요.
const MAX_WAIT_MS = 600_000;
const RECONNECT_DELAY_MS = 2_000;
// 같은 별 세 개를 골랐는지
export const isSameSelection = (a: GenerateRequest, b: GenerateRequest) =>
  a.background === b.background && a.charSpecies === b.charSpecies && a.morality === b.morality;

const toPage = (c: PageContent): StoryPage => ({
  page: c.pageNo,
  text: c.text.join('\n'),
  sentences: c.text,
  imageUrl: c.imageUrl,
});

// 쪽 번호 순서로 합쳐요. 그림은 새 값이 없으면 받아 둔 것을 지켜요.
function mergePages(pages: StoryPage[], incoming: StoryPage[]) {
  const byPage = new Map(pages.map((p) => [p.page, p]));
  for (const p of incoming) {
    const prev = byPage.get(p.page);
    byPage.set(p.page, { ...prev, ...p, imageUrl: p.imageUrl ?? prev?.imageUrl ?? null });
  }
  return [...byPage.values()].sort((a, b) => a.page - b.page);
}

// Figma "준비 완료": 첫 3쪽의 글 · 그림이 모두 오면 읽기 화면으로 넘어가요. (그 전에 done 이 오면 그때)
const READY_PAGES = 3;
const isReady = (pages: StoryPage[]) =>
  Array.from({ length: READY_PAGES }, (_, i) => i + 1).every((n) => {
    const p = pages.find((x) => x.page === n);
    return !!p?.text && !!p.imageUrl;
  });

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
  });

// 4xx(토큰 만료 · 없는 동화 등)는 다시 연결해도 같아서 바로 실패로 봐요.
const isFatal = (e: unknown) =>
  e instanceof ApiError && e.status >= 400 && e.status < 500 && e.status !== 408;

// 지금 이어지고 있는 작업. 새로 시작하거나 비우면 끊어요.
let controller: AbortController | null = null;

// 동화 생성 상태. 만드는 중 → 동화 프레임으로 화면이 바뀌어도 연결이 끊기지 않도록
// 화면이 아니라 전역 스토어가 연결을 들고 있어요.
// 흐름(API 명세): POST /api/fairytales → id → GET /api/fairytales/{id}/sse (connect · page_content · done)
export const useGenerationStore = create<GenerationState>()((set, get) => {
  const begin = () => {
    controller?.abort();
    const current = new AbortController();
    controller = current;
    return current;
  };

  // 새 쪽이 늘었거나 그림이 새로 채워졌으면 true (글은 다 오고 그림만 늦게 오는 구간도 진행으로 봐요)
  const addPages = (incoming: StoryPage[]) => {
    if (!incoming.length) return false;
    const before = get().pages;
    const pages = mergePages(before, incoming);
    set({
      pages,
      totalPages: pages.length + 1,
      ...(get().status === 'connecting' && isReady(pages) ? { status: 'ready' as const } : {}),
    });
    const images = (list: StoryPage[]) => list.filter((p) => p.imageUrl).length;
    return pages.length > before.length || images(pages) > images(before);
  };

  // 연결이 끊긴 사이에 보낸 쪽은 SSE 로 다시 오지 않아서, 동화 조회로 채워요.
  const catchUp = async (id: string, signal: AbortSignal): Promise<Story | null> => {
    try {
      const story = await fetchStory(id, signal);
      if (signal.aborted) return null;
      set({ meta: { title: story.title } });
      return story;
    } catch (error) {
      if (isFatal(error)) throw error;
      return null;
    }
  };

  // 완료 신호를 받은 뒤에만 완성 상태로 바꿔요.
  const finish = async (id: string, signal: AbortSignal) => {
    const story = await catchUp(id, signal);
    if (signal.aborted) return;
    if (
      !story ||
      story.id !== id ||
      !story.pages.length ||
      !story.pages.every((page, i) => page.page === i + 1 && page.text.trim())
    ) {
      throw new ApiError(
        0,
        'RESULT_PENDING',
        '완료된 동화의 내용을 아직 받지 못했어요. 결과를 다시 확인해 주세요.',
      );
    }
    addPages(story.pages);
    queryClient.setQueryData(['story', id], story);
    const { pages } = get();
    set({ status: 'done', totalPages: pages.length });
  };

  // done 을 받을 때까지 SSE 에 붙어 있어요. 끊기면 빠진 쪽을 채우고 다시 연결해요.
  const follow = async (id: string, current: AbortController) => {
    const { signal } = current;

    for (;;) {
      let done = false;
      // 연결마다 따로 닫을 수 있게 해요. done 을 받으면 서버가 연결을 유지해도 이 연결만 닫고 바로 끝내요.
      const round = new AbortController();
      const stop = () => round.abort();
      signal.addEventListener('abort', stop, { once: true });
      try {
        await subscribeStory(id, {
          signal: round.signal,
          onEvent: (e) => {
            if (signal.aborted) return;
            if (e.event === 'page') addPages([toPage(e.data)]);
            if (e.event === 'done') {
              done = true;
              set({ receivedDone: true });
              round.abort();
            }
          },
        });
      } catch (e) {
        if (signal.aborted) return;
        if (!done && isFatal(e)) {
          current.abort();
          set({ status: 'error', error: e instanceof ApiError ? e.message : FALLBACK_ERROR });
          return;
        }
      } finally {
        signal.removeEventListener('abort', stop);
      }
      if (signal.aborted) return;
      if (done) return finish(id, signal);

      const story = await catchUp(id, signal);
      if (signal.aborted) return;
      if (story) addPages(story.pages);

      await sleep(RECONNECT_DELAY_MS, signal);
      if (signal.aborted) return;
    }
  };

  const run = async (current: AbortController, work: () => Promise<void>) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        work(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () =>
              reject(
                new ApiError(
                  0,
                  'RESULT_TIMEOUT',
                  '아직 생성 완료를 확인하지 못했어요. 서버 작업은 계속될 수 있어요.',
                ),
              ),
            MAX_WAIT_MS,
          );
        }),
      ]);
    } catch (e) {
      if (current.signal.aborted) return;
      // TypeError 같은 내부 문구가 아이 화면에 보이지 않게, 서버 · 네트워크 오류 문구만 보여 줘요.
      current.abort();
      const uncertain =
        !get().storyId && !(e instanceof ApiError && isFatal(e) && e.status !== 409);
      set({
        status: 'error',
        retryAction: uncertain ? 'bookshelf' : 'retry',
        error: uncertain
          ? '생성 요청 결과를 확인하지 못했어요. 중복 생성을 막기 위해 책장에서 먼저 확인해 주세요.'
          : e instanceof ApiError
            ? e.message
            : FALLBACK_ERROR,
      });
    } finally {
      clearTimeout(timer);
      if (controller === current) controller = null;
    }
  };

  return {
    ...INITIAL,

    start: async (request) => {
      const previous = get();
      if (previous.status === 'connecting' || previous.status === 'ready') return;
      if (previous.status === 'error') {
        if (previous.retryAction === 'bookshelf') return;
        if (previous.request && isSameSelection(previous.request, request) && previous.storyId) {
          get().retry();
          return;
        }
      }
      const current = begin();
      set({ ...INITIAL, status: 'connecting', request });
      await run(current, async () => {
        const id = await createFairytale(request, current.signal);
        if (current.signal.aborted) return;
        set({ storyId: id });
        await follow(id, current);
      });
    },

    // 동화를 이미 만들었으면 같은 동화에 다시 연결하고, 만들기 전에 실패했으면 새로 만들어요.
    retry: () => {
      const { request, storyId, pages, retryAction, status } = get();
      if (retryAction === 'bookshelf' || status === 'connecting' || status === 'ready') return;
      if (!storyId) {
        if (request) void get().start(request);
        return;
      }
      const current = begin();
      set({ status: isReady(pages) ? 'ready' : 'connecting', error: null });
      void run(current, () =>
        get().receivedDone ? finish(storyId, current.signal) : follow(storyId, current),
      );
    },

    reset: () => {
      controller?.abort();
      controller = null;
      set(INITIAL);
    },
  };
});

// 로그아웃하면 만들던 동화도 끊고 비워요.
onSignOut(() => useGenerationStore.getState().reset());
