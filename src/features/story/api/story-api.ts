import type { GenerateRequest, Story, StoryEvent } from '@/features/story/api/types';
import { streamSse } from '@/features/story/api/sse-client';
import { request } from '@/lib/api-client';

const EVENTS = new Set<StoryEvent['event']>([
  'started',
  'meta',
  'text',
  'image',
  'ready',
  'done',
  'error',
]);

const isStoryEvent = (m: { event: string }): m is StoryEvent =>
  EVENTS.has(m.event as StoryEvent['event']);

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
      if (isStoryEvent(m)) onEvent(m);
    },
  });

export async function fetchStory(id: string): Promise<Story> {
  const { story } = await request<{ story: Story }>(`/api/stories/${id}`);
  return story;
}
