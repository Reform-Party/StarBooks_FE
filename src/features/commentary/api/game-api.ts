import { ApiError, request } from '@/lib/api-client';
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

// 게임 API 는 모두 data 가 있어야 하는 응답이에요. 비어 있으면 null 이 화면까지 가지 않게 여기서 막아요.
// 타임아웃(10초) · 바깥 취소는 공용 request 가 맡아요.
async function gameRequest<T>(path: string, options?: Parameters<typeof request>[1]) {
  const data = await request<T | null | undefined>(path, options);
  if (data == null) throw new ApiError(0, 'EMPTY', '응답이 비어 있어요');
  return data;
}

const post = <T>(path: string, body: object) => gameRequest<T>(path, { method: 'POST', body });

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

export const fetchGameGraph = (fairytaleId: number, signal?: AbortSignal) =>
  gameRequest<GameGraphData>(`/api/game/graph?fairytale_id=${fairytaleId}`, { signal });

export const fetchEdge = (edgeId: number, signal?: AbortSignal) =>
  gameRequest<EdgeData>(`/api/game/edge?edge_id=${edgeId}`, { signal });

// 게임 세션이 서버에서 사라졌어요(GAME_404_1) → /api/game/start 부터 다시 해야 해요.
export const isSessionExpired = (e: unknown) => e instanceof ApiError && e.code === 'GAME_404_1';
