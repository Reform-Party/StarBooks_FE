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
import { buildDummyStory } from '@/features/story/constants/dummy-story';
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
const LOST_ERROR = '연결이 끊어졌어요. 다시 시도해 주세요';

// 명세: 연결은 1시간 유지, done 전에 끊기면 다시 연결해요.
const MAX_WAIT_MS = 60 * 60 * 1000;
const RECONNECT_DELAY_MS = 2_000;
// 다시 연결해도 새 쪽이 이만큼 연속으로 없으면, 받은 쪽이 있으면 끝난 것으로 · 없으면 실패로 봐요.
// (done 을 연결이 끊긴 사이에 보냈으면 다시 오지 않아요)
const MAX_IDLE_ROUNDS = 3;

// 이만큼 기다려도 읽기 화면으로 못 넘어가면: 받은 쪽이 있으면 그것부터 보여 주고, 없으면 더미 동화로 대신해요.
// (지금 서버는 첫 쪽이 30초쯤 와서 그보다 넉넉하게 둬요)
const OPEN_TIMEOUT_MS = 45_000;
// EXPO_PUBLIC_STORY_DUMMY=1 이면 서버를 부르지 않고 잠깐 뒤 더미 동화를 보여 줘요. (발표 · 시연용)
const DUMMY_ONLY = process.env.EXPO_PUBLIC_STORY_DUMMY === '1';
const DUMMY_DELAY_MS = 3_000;

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

  // 서버 대신 더미 동화로 끝내요. 지금 연결은 끊어요.
  const showDummy = () => {
    const { request } = get();
    if (!request) return;
    controller?.abort();
    controller = null;
    const story = buildDummyStory(request);
    queryClient.setQueryData(['story', story.id], story);
    set({
      status: 'done',
      storyId: story.id,
      meta: { title: story.title },
      pages: story.pages,
      totalPages: story.pages.length,
      error: null,
    });
  };

  // 아직 한 쪽도 못 받았으면 더미로 대신하고, 읽던 중이면 오류 안내(다시 시도)를 보여 줘요.
  // 4xx(요청 값 · 명세 차이 등)는 더미로 덮지 않고 오류 안내를 보여 줘요. (개발 중에 서버 문제를 놓치지 않게)
  // 더미는 네트워크 · 시간 초과 · 5xx 일 때만이에요.
  const fail = (error: string, cause?: unknown) => {
    if (!isFatal(cause) && !get().pages.length && get().request) showDummy();
    else set({ status: 'error', error });
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
      const story = await fetchStory(id);
      if (signal.aborted) return null;
      set({ meta: { title: story.title } });
      return story;
    } catch {
      return null;
    }
  };

  // complete: done 을 받았는지. done 없이 새 쪽이 끊겨 끝낸 경우(추정 종료)는 false 예요.
  const finish = async (id: string, signal: AbortSignal, complete: boolean) => {
    const story = await catchUp(id, signal);
    if (signal.aborted) return;
    if (story) {
      addPages(story.pages);
      // done 을 받은 동화만 캐시에 넣어 같은 id 를 다시 열 때 재요청하지 않아요.
      // 추정 종료면 뒷부분이 빠졌을 수 있어서 넣지 않고, 다음에 열 때 다시 조회해요. (use-story 는 staleTime: Infinity)
      if (complete) queryClient.setQueryData(['story', id], story);
    }
    const { pages } = get();
    if (!pages.length) {
      fail(FALLBACK_ERROR);
      return;
    }
    set({ status: 'done', totalPages: pages.length });
  };

  // done 을 받을 때까지 SSE 에 붙어 있어요. 끊기면 빠진 쪽을 채우고 다시 연결해요.
  const follow = async (id: string, current: AbortController) => {
    const { signal } = current;
    const startedAt = Date.now();
    let idleRounds = 0;
    for (;;) {
      let progressed = false;
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
            if (e.event === 'page') progressed = addPages([toPage(e.data)]) || progressed;
            if (e.event === 'done') {
              done = true;
              round.abort();
            }
          },
        });
      } catch (e) {
        if (signal.aborted) return;
        if (!done && isFatal(e)) {
          current.abort();
          fail(e instanceof ApiError ? e.message : FALLBACK_ERROR, e);
          return;
        }
      } finally {
        signal.removeEventListener('abort', stop);
      }
      if (signal.aborted) return;
      if (done) return finish(id, signal, true);

      const story = await catchUp(id, signal);
      if (signal.aborted) return;
      if (story) progressed = addPages(story.pages) || progressed;

      idleRounds = progressed ? 0 : idleRounds + 1;
      if (idleRounds >= MAX_IDLE_ROUNDS || Date.now() - startedAt > MAX_WAIT_MS) {
        if (get().pages.length) return finish(id, signal, false);
        fail(LOST_ERROR);
        return;
      }
      await sleep(RECONNECT_DELAY_MS, signal);
      if (signal.aborted) return;
    }
  };

  const run = async (current: AbortController, work: () => Promise<void>) => {
    try {
      await work();
    } catch (e) {
      if (current.signal.aborted) return;
      // TypeError 같은 내부 문구가 아이 화면에 보이지 않게, 서버 · 네트워크 오류 문구만 보여 줘요.
      fail(e instanceof ApiError ? e.message : FALLBACK_ERROR, e);
    } finally {
      if (controller === current) controller = null;
    }
  };

  return {
    ...INITIAL,

    start: async (request) => {
      const current = begin();
      set({ ...INITIAL, status: 'connecting', request });

      if (DUMMY_ONLY) {
        await sleep(DUMMY_DELAY_MS, current.signal);
        if (!current.signal.aborted) showDummy();
        return;
      }

      const timer = setTimeout(() => {
        if (current.signal.aborted || get().status !== 'connecting') return;
        if (get().pages.length) set({ status: 'ready' });
        else showDummy();
      }, OPEN_TIMEOUT_MS);
      try {
        await run(current, async () => {
          const id = await createFairytale(request, current.signal);
          if (current.signal.aborted) return;
          set({ storyId: id });
          await follow(id, current);
        });
      } finally {
        clearTimeout(timer);
      }
    },

    // 동화를 이미 만들었으면 같은 동화에 다시 연결하고, 만들기 전에 실패했으면 새로 만들어요.
    retry: () => {
      const { request, storyId, pages } = get();
      if (!storyId) {
        if (request) void get().start(request);
        return;
      }
      const current = begin();
      set({ status: isReady(pages) ? 'ready' : 'connecting', error: null });
      void run(current, () => follow(storyId, current));
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
