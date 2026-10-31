// 동화 생성 · 동화 조회 API 타입. 백엔드 명세가 확정되면 여기서 맞춰요.

export type StoryPage = { page: number; text: string; imageUrl: string | null };

export type StoryMeta = {
  title: string;
  summary?: string;
  characters?: unknown[];
  constellationStory?: string;
};

export type Story = StoryMeta & { id: string; pages: StoryPage[] };

// POST /api/stories/generate 본문
export type GenerateRequest = {
  lessonId: string;
  speciesId: string;
  backgroundId: string;
  constellation: {
    stars: { key: string; optionId: string; x: number; y: number; z: number }[];
  };
};

// SSE 이벤트 (event: <이름>\ndata: <JSON>)
export type StoryEvent =
  | { event: 'started'; data: { storyId: string; totalPages: number } }
  | { event: 'meta'; data: StoryMeta }
  | { event: 'text'; data: { page: number; delta: string } }
  | { event: 'image'; data: { page: number; url: string } }
  // 글 3문장과 첫 3쪽 그림이 준비됐다는 신호 → 읽기 화면으로 넘어가요.
  | { event: 'ready'; data: { storyId: string } }
  | { event: 'done'; data: { story: Story } }
  | { event: 'error'; data: { code?: string; message?: string } };
