import { queryOptions, skipToken, useMutation, useQuery } from '@tanstack/react-query';

import {
  answerQuiz,
  classifyNode,
  fetchEdge,
  fetchGameGraph,
  requestQuiz,
  startGame,
} from '@/features/commentary/api/game-api';
import type { Category, EdgeData } from '@/features/commentary/api/types';
import { ApiError } from '@/lib/api-client';

// 4xx 는 다시 보내도 결과가 같아서 바로 에러 화면을 보여주고, 그 밖의 오류만 한 번 더 시도해요.
// (TanStack Query 는 첫 실패에 count 0 으로 불러요 → count < 1 이면 딱 한 번 더)
const retryOnceUnlessClientError = (count: number, e: unknown) =>
  !(e instanceof ApiError && e.status >= 400 && e.status < 500) && count < 1;

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

// 완성 관계도와 관계 설명은 한 번 받으면 바뀌지 않아서 다시 요청하지 않아요 (staleTime: Infinity).

// 이미 끝낸 게임(409 GAME_409_1)이면 완성된 관계도를 불러와요.
export function useGameGraph(fairytaleId: number, enabled: boolean) {
  return useQuery({
    queryKey: ['game', 'graph', fairytaleId],
    queryFn: ({ signal }) => fetchGameGraph(fairytaleId, signal),
    enabled,
    staleTime: Infinity,
    retry: retryOnceUnlessClientError,
  });
}

// 3단계에서 선을 누르면 핸들러가 queryClient.fetchQuery(edgeQueryOptions(id)) 로 불러와요.
// 실패를 그 자리에서 배너로 알리려고 effect 대신 핸들러에서 불러요.
export const edgeQueryOptions = (edgeId: number) =>
  queryOptions({
    queryKey: ['game', 'edge', edgeId],
    queryFn: ({ signal }) => fetchEdge(edgeId, signal),
    staleTime: Infinity,
    retry: retryOnceUnlessClientError,
  });

// 해설 모달은 위에서 불러온 설명을 캐시에서 읽기만 해요 (여기서는 요청하지 않아요).
export function useCachedEdge(edgeId: number | null) {
  return useQuery<EdgeData>({ queryKey: ['game', 'edge', edgeId], queryFn: skipToken });
}
