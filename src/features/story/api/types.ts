// 동화 생성 · 동화 조회 API 타입 (노션 API 명세 기준)

export type StoryPage = {
  page: number;
  text: string;
  imageUrl: string | null;
  sentences?: string[];
  ttsUrl?: string | null;
};

export type StoryVocab = {
  wordEntryId: number;
  pageNo: number;
  word: string;
  meaning: string;
};

export type StoryMeta = {
  title: string;
  summary?: string;
  characters?: unknown[];
  constellationStory?: string;
};

export type Story = StoryMeta & {
  id: string;
  pages: StoryPage[];
  authorName?: string;
  vocab?: StoryVocab[];
};

// POST /api/fairytales 본문 (API 명세 "동화 만들기"). 값은 make/constants/story-options 의 id 예요.
export type GenerateRequest = {
  background: string;
  charSpecies: string;
  morality: string;
};

// GET /api/fairytales/{fairytaleId}/sse 의 page_content 한 쪽 (API 명세 "SSE 통신 요청&받는 형식")
export type PageContent = {
  fairytaleId: number;
  pageNo: number;
  text: string[];
  vocab: { word: string; meaning: string } | null;
  imageUrl: string | null;
};

// SSE 이벤트. connect(연결됨) → page_content(한 쪽씩) → done(다 만듦)
export type StoryEvent =
  { event: 'connect' } | { event: 'page'; data: PageContent } | { event: 'done' };
