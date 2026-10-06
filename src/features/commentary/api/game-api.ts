import { request } from '@/features/commentary/api/api-client';
import type {
  Category,
  ClassifyData,
  GameGraph,
  GameGraphData,
  GameStartData,
  GraphEdge,
  QuizAnswerData,
  QuizData,
} from '@/features/commentary/api/types';

const post = <T>(path: string, body: object) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) });

export const startGame = (fairytaleId: number) =>
  post<GameStartData>('/api/game/start', { fairytaleId });

export const classifyNode = (sessionId: string, nodeId: number, category: Category) =>
  post<ClassifyData>('/api/game/classify', { sessionId, nodeId, category });

export const requestQuiz = (sessionId: string, fromNodeId: number, toNodeId: number) =>
  post<QuizData>('/api/game/quiz', { sessionId, fromNodeId, toNodeId });

// 명세의 완료 응답 예시만 snake_case(stage_complete, edge_id)라서 두 표기를 모두 받아 맞춰요.
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
    graph: raw.graph && {
      nodes: raw.graph.nodes,
      edges: raw.graph.edges.map((e) => ({
        edgeId: e.edgeId ?? e.edge_id ?? 0,
        from: e.from,
        to: e.to,
      })),
    },
  };
}

export const fetchGameGraph = (fairytaleId: number) =>
  request<GameGraphData>(`/api/game/graph?fairytale_id=${fairytaleId}`);
