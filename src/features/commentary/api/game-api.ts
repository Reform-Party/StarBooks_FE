import { ApiError, isAbortError, request } from '@/lib/api-client';
import type {
  Category,
  ClassifyData,
  EdgeData,
  GameGraph,
  GameGraphData,
  GameStartData,
  GraphEdge,
  QuizAnswerData,
  QuizData,
} from '@/features/commentary/api/types';

const TIMEOUT_MS = 10_000;

// 공용 request 위에 두 가지를 더해요.
// - 응답이 안 오면 버튼 · 트레이가 계속 막혀 있지 않게 10초 뒤 끊어요.
// - 게임 화면은 data 가 꼭 있어야 해서, 빈 응답이면 바로 ApiError 로 알려요.
async function call<T>(path: string, body?: object): Promise<T> {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);
  try {
    const data = await request<T | null>(path, {
      method: body ? 'POST' : 'GET',
      body,
      signal: abort.signal,
    });
    if (data == null) throw new ApiError(0, 'EMPTY', '응답이 비어 있어요.');
    return data;
  } catch (e) {
    if (isAbortError(e)) throw new ApiError(0, 'TIMEOUT', '응답이 너무 늦어요.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

const post = <T>(path: string, body: object) => call<T>(path, body);

export const startGame = (fairytaleId: number) =>
  post<GameStartData>('/api/game/start', { fairytaleId });

export const classifyNode = (sessionId: string, nodeId: number, category: Category) =>
  post<ClassifyData>('/api/game/classify', { sessionId, nodeId, category });

export const requestQuiz = (sessionId: string, fromNodeId: number, toNodeId: number) =>
  post<QuizData>('/api/game/quiz', { sessionId, fromNodeId, toNodeId });

// 명세의 완료 응답 예시만 snake_case(stage_complete, edge_id)라서 두 표기를 모두 받아 맞춰요.
// BE 응답 표기가 camelCase 로 통일되면 이 변환은 지워요.
type RawEdge = Partial<GraphEdge> & { edge_id?: number; from: number; to: number };
type RawAnswer = Omit<QuizAnswerData, 'stageComplete' | 'graph'> & {
  stageComplete?: boolean;
  stage_complete?: boolean;
  graph?: { nodes: GameGraph['nodes']; edges: RawEdge[] };
};

export async function answerQuiz(
  sessionId: string,
  quizId: string,
  selectedChoiceId: number,
): Promise<QuizAnswerData> {
  const raw = await post<RawAnswer>('/api/game/quiz/answer', {
    sessionId,
    quizId,
    selectedChoiceId,
  });
  return {
    correct: raw.correct,
    stageComplete: raw.stageComplete ?? raw.stage_complete ?? false,
    description: raw.description,
    hint: raw.hint,
    selectedCharSpecies: raw.selectedCharSpecies,
    selectedBackground: raw.selectedBackground,
    graph: raw.graph && {
      nodes: raw.graph.nodes,
      edges: raw.graph.edges.map((e) => ({
        edgeId: e.edgeId ?? e.edge_id,
        from: e.from,
        to: e.to,
      })),
    },
  };
}

export const fetchGameGraph = (fairytaleId: number) =>
  call<GameGraphData>(`/api/game/graph?fairytale_id=${fairytaleId}`);

export const fetchEdge = (edgeId: number) => call<EdgeData>(`/api/game/edge?edge_id=${edgeId}`);

// 게임 세션이 서버에서 사라졌어요(GAME_404_1) → /api/game/start 부터 다시 해야 해요.
export const isSessionExpired = (e: unknown) => e instanceof ApiError && e.code === 'GAME_404_1';
