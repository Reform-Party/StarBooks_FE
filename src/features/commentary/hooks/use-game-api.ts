import { skipToken, useMutation, useQuery } from '@tanstack/react-query';

import {
  answerQuiz,
  classifyNode,
  fetchEdge,
  fetchGameGraph,
  requestQuiz,
  startGame,
} from '@/features/commentary/api/game-api';
import type { Category } from '@/features/commentary/api/types';
import { ApiError } from '@/lib/api-client';

// 4xx 는 다시 보내도 결과가 같아서 바로 에러 화면을 보여주고, 그 밖의 오류만 한 번 더 시도해요.
const retryUnlessClientError = (count: number, e: unknown) =>
  !(e instanceof ApiError && e.status >= 400 && e.status < 500) && count < 2;

export function useStartGame() {
  return useMutation({ mutationFn: (fairytaleId: number) => startGame(fairytaleId) });
}

export function useClassifyNode(sessionId: string) {
  return useMutation({
    mutationFn: ({ nodeId, category }: { nodeId: number; category: Category }) =>
      classifyNode(sessionId, nodeId, category),
  });
}

export function useRequestQuiz(sessionId: string) {
  return useMutation({
    mutationFn: ({ from, to }: { from: number; to: number }) => requestQuiz(sessionId, from, to),
  });
}

export function useAnswerQuiz(sessionId: string) {
  return useMutation({
    mutationFn: ({ quizId, choiceId }: { quizId: string; choiceId: number }) =>
      answerQuiz(sessionId, quizId, choiceId),
  });
}

// 이미 끝낸 게임(409 GAME_409_1)이면 완성된 관계도를 불러와요.
export function useGameGraph(fairytaleId: number, enabled: boolean) {
  return useQuery({
    queryKey: ['game', 'graph', fairytaleId],
    queryFn: () => fetchGameGraph(fairytaleId),
    enabled,
    retry: retryUnlessClientError,
  });
}

// 3단계에서 선을 톡 누르면 그 관계 설명을 불러와요. (edgeId 가 없으면 요청하지 않아요)
export function useGameEdge(edgeId: number | null) {
  return useQuery({
    queryKey: ['game', 'edge', edgeId],
    queryFn: edgeId == null ? skipToken : () => fetchEdge(edgeId),
    retry: retryUnlessClientError,
  });
}
