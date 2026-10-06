import { useMutation, useQuery } from '@tanstack/react-query';

import {
  answerQuiz,
  classifyNode,
  fetchGameGraph,
  requestQuiz,
  startGame,
} from '@/features/commentary/api/game-api';
import type { Category } from '@/features/commentary/api/types';

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
  });
}
