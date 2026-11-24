import { type SseMessage, streamSse } from '@/features/story/api/sse-client';
import type { GenerateRequest, Story, StoryEvent, StoryPage } from '@/features/story/api/types';
import { ApiError, request } from '@/lib/api-client';

// 규격이 목 서버 기준이라, BE 와 필드가 달라도 화면이 깨지지 않게 이벤트마다 필요한 필드를 확인해요.
type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null;
const isStr = (v: unknown): v is string => typeof v === 'string';
const isPageNo = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 1;

const isPage = (v: unknown): v is StoryPage =>
  isObj(v) && isPageNo(v.page) && isStr(v.text) && (v.imageUrl === null || isStr(v.imageUrl));

const isStory = (v: unknown): v is Story =>
  isObj(v) && isStr(v.id) && isStr(v.title) && Array.isArray(v.pages) && v.pages.every(isPage);

const VALIDATORS: Record<StoryEvent['event'], (d: unknown) => boolean> = {
  started: (d) =>
    isObj(d) && isStr(d.storyId) && typeof d.totalPages === 'number' && d.totalPages >= 0,
  meta: (d) => isObj(d) && isStr(d.title),
  text: (d) => isObj(d) && isPageNo(d.page) && isStr(d.delta),
  image: (d) => isObj(d) && isPageNo(d.page) && isStr(d.url),
  page: isPage,
  ready: (d) => isObj(d) && isStr(d.storyId),
  done: (d) => isObj(d) && isStory(d.story),
  recovered: (d) => isObj(d) && isStory(d.story),
  error: (d) =>
    isObj(d) &&
    (d.code === undefined || isStr(d.code)) &&
    (d.message === undefined || isStr(d.message)),
};

const isEventName = (name: string): name is StoryEvent['event'] =>
  Object.prototype.hasOwnProperty.call(VALIDATORS, name);

// 모르는 이벤트는 null(건너뜀), 아는 이벤트인데 필드가 맞지 않으면 error 이벤트로 바꿔요.
export function toStoryEvent(m: SseMessage): StoryEvent | null {
  if (!isEventName(m.event)) return null;
  if (VALIDATORS[m.event](m.data)) return { event: m.event, data: m.data } as StoryEvent;
  return { event: 'error', data: { code: 'BAD_EVENT' } };
}

type GenerateOptions = {
  resumeId?: string;
  signal?: AbortSignal;
  onEvent: (event: StoryEvent) => void;
  onProgress?: (phase: 'post' | 'sse' | 'detail', message: string) => void;
};

function waitForResult(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const cancel = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', cancel);
      resolve();
    }, ms);
    signal?.addEventListener('abort', cancel, { once: true });
    if (signal?.aborted) cancel();
  });
}

// 동화 만들기 (SSE). 이벤트: started · meta · text · image · ready · done · error
export async function generateStory(body: GenerateRequest, options: GenerateOptions) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  options.signal?.addEventListener('abort', cancel, { once: true });
  if (options.signal?.aborted) cancel();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let phase: 'post' | 'sse' | 'detail' = 'post';
  try {
    await Promise.race([
      generateStoryResult(body, {
        ...options,
        signal: controller.signal,
        onProgress: (next, message) => {
          phase = next;
          options.onProgress?.(next, message);
        },
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(
            new ApiError(
              0,
              'RESULT_TIMEOUT',
              '아직 생성 완료를 확인하지 못했어요. 서버 작업은 계속될 수 있어요. 같은 동화의 결과를 다시 확인해 주세요.',
            ),
          );
          controller.abort();
        }, 600_000);
      }),
    ]);
  } catch (error) {
    options.onProgress?.(
      phase,
      error instanceof ApiError
        ? `오류 HTTP ${error.status} · ${error.code}`
        : '요청 중단 또는 응답 처리 오류',
    );
    throw error;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', cancel);
    controller.abort();
  }
}

async function generateStoryResult(
  body: GenerateRequest,
  { signal, onEvent, resumeId, onProgress }: GenerateOptions,
) {
  signal?.throwIfAborted();
  const morals: Record<string, string> = {
    KINDNESS: 'KINDNESS_REWARDED',
    YIELDING: 'NO_GREED',
    PERSISTENCE: 'PERSEVERANCE',
    WISDOM: 'USE_WISDOM',
    PROMISE: 'KEEP_PROMISE',
    HONESTY: 'NO_LYING',
    DIVERSITY: 'RESPECT_DIFF',
    LISTENING: 'OBEY_ELDERS',
    TEAMWORK: 'COOPERATION',
  };
  onProgress?.('post', resumeId ? '기존 ID 사용 · POST 재전송 없음' : '요청 중');
  const created =
    resumeId ??
    (await request<unknown>('/api/fairytales', {
      method: 'POST',
      signal,
      onStatus: (status) => onProgress?.('post', `HTTP ${status}`),
      body: {
        background: body.backgroundId,
        charSpecies: body.speciesId,
        morality: morals[body.lessonId] ?? body.lessonId,
      },
    }));
  // 성공 응답은 아직 문서화되지 않아 런타임에서 ID를 검증해요.
  const candidate = isObj(created) ? created.fairytaleId : created;
  const id =
    typeof candidate === 'number' || typeof candidate === 'string' ? String(candidate) : '';
  if (!isNumericStoryId(id)) {
    throw new ApiError(
      0,
      'GENERATION_FAILED',
      '생성 요청은 접수됐지만 동화 번호를 확인하지 못했어요. 중복 생성하지 않도록 책장에서 먼저 확인해 주세요.',
    );
  }
  onEvent({ event: 'started', data: { storyId: id, totalPages: 0 } });
  let receivedDone = false;
  let story: Story | null = null;
  let connects = 0;
  let pageEvents = 0;
  const checkStory = async () => {
    onProgress?.('detail', '조회 중');
    try {
      const result = await fetchStory(id, signal);
      signal?.throwIfAborted();
      onProgress?.('detail', `조회 성공 · ${result.pages.length}쪽`);
      // 일부 문단만 저장된 상세도 200일 수 있어요. 완료 신호 없이는 자동으로 열지 않아요.
      const readable =
        result.id === id &&
        result.pages.length > 0 &&
        result.pages.every((page, index) => page.page === index + 1 && page.text.trim());
      if (!receivedDone)
        onProgress?.('detail', `조회 성공 · ${result.pages.length}쪽 · 완료 신호 대기`);
      return receivedDone && readable ? result : null;
    } catch (error) {
      onProgress?.(
        'detail',
        error instanceof ApiError ? `오류 HTTP ${error.status} · ${error.code}` : '응답 처리 오류',
      );
      if (signal?.aborted) throw error;
      if (error instanceof ApiError && [0, 404, 409, 503].includes(error.status)) return null;
      throw error;
    }
  };
  for (let connection = 0; connection < 20 && !receivedDone; connection++) {
    onProgress?.('sse', `연결 ${connection + 1}/20 시작`);
    try {
      await streamSse('/api/fairytales/' + id + '/sse', {
        method: 'GET',
        idleTimeoutMs: 30_000,
        maxDurationMs: 30_000,
        onStatus: (status) => onProgress?.('sse', `연결 ${connection + 1}/20 · HTTP ${status}`),
        signal,
        onMessage: (message) => {
          if (signal?.aborted) return true;
          if (message.event === 'connect') connects++;
          if (message.event === 'page-content' || message.event === 'page_content') pageEvents++;
          onProgress?.(
            'sse',
            `연결 ${connection + 1}/20 · connect ${connects} · page ${pageEvents} · done ${message.event === 'done' || message.data === 'done' ? 1 : 0}`,
          );
          if (message.event === 'done' || message.data === 'done') {
            receivedDone = true;
            return true;
          }
          if (message.event === 'error')
            throw new ApiError(200, 'GENERATION_FAILED', '동화 생성 중 서버 오류가 발생했어요');
          if (message.event === 'page-content' || message.event === 'page_content') {
            const page = message.data;
            if (
              !isObj(page) ||
              String(page.fairytaleId) !== id ||
              !isPageNo(page.pageNo) ||
              !Array.isArray(page.text) ||
              !page.text.every(isStr) ||
              !(page.imageUrl === null || isStr(page.imageUrl))
            ) {
              throw new ApiError(200, 'BAD_EVENT', '동화 페이지 응답 형식을 확인하지 못했어요');
            }
            onEvent({
              event: 'page',
              data: {
                page: page.pageNo,
                text: page.text.join('\n'),
                sentences: page.text,
                imageUrl: page.imageUrl,
              },
            });
          }
        },
      });
    } catch (error) {
      onProgress?.(
        'sse',
        error instanceof ApiError
          ? `오류 HTTP ${error.status} · ${error.code} · connect ${connects} · page ${pageEvents}`
          : '연결 오류',
      );
      if (signal?.aborted) throw error;
      if (error instanceof ApiError && error.status !== 0) throw error;
      // 완료 이벤트 유실이나 연결 종료 후에도 생성된 ID로 결과만 조회해요.
    }
    story = await checkStory();
    if (story) break;
    if (!receivedDone && connection < 19) await waitForResult(30_000, signal);
  }
  for (let attempt = 0; attempt < 12 && !story; attempt++) {
    signal?.throwIfAborted();
    story = await checkStory();
    if (story) break;
    if (attempt < 11) await waitForResult(3000, signal);
  }
  if (!story)
    throw new ApiError(
      0,
      'RESULT_PENDING',
      '아직 생성 완료를 확인하지 못했어요. 같은 동화의 결과를 다시 확인해 주세요.',
    );
  signal?.throwIfAborted();
  onEvent({ event: 'meta', data: { title: story.title } });
  onEvent({ event: 'done', data: { story } });
}

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
    throw new ApiError(0, 'GENERATION_FAILED', '동화 번호가 올바르지 않아요.');
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
