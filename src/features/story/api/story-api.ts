import type { GenerateRequest, Story, StoryEvent, StoryPage } from '@/features/story/api/types';
import { type SseMessage, streamSse } from '@/features/story/api/sse-client';
import { request } from '@/lib/api-client';

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
  ready: (d) => isObj(d) && isStr(d.storyId),
  done: (d) => isObj(d) && isStory(d.story),
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
  signal?: AbortSignal;
  onEvent: (event: StoryEvent) => void;
};

// 동화 만들기 (SSE). 이벤트: started · meta · text · image · ready · done · error
export const generateStory = (body: GenerateRequest, { signal, onEvent }: GenerateOptions) =>
  streamSse('/api/stories/generate', {
    body,
    signal,
    onMessage: (m) => {
      const event = toStoryEvent(m);
      if (event) onEvent(event);
    },
  });

// id 는 딥링크(starbooks://story/...)로도 들어오고 디코딩된 채 넘어와서, 형식이 맞을 때만 요청해요.
const STORY_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
export const isValidStoryId = (id: unknown): id is string => isStr(id) && STORY_ID_RE.test(id);

export async function fetchStory(id: string): Promise<Story> {
  const { story } = await request<{ story: Story }>(`/api/stories/${encodeURIComponent(id)}`);
  return story;
}
