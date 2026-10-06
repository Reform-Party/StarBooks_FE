import { useEffect, useMemo, useRef, useState } from 'react';

import { ApiError } from '@/features/commentary/api/api-client';
import type { Category, GameNode, QuizChoice } from '@/features/commentary/api/types';
import Baskets from '@/features/commentary/components/baskets';
import DraggableNode, { type LineDrag } from '@/features/commentary/components/draggable-node';
import ExplainModal from '@/features/commentary/components/explain-modal';
import LinkLines from '@/features/commentary/components/link-lines';
import QuizModal, { type ChooseResult } from '@/features/commentary/components/quiz-modal';
import StepHeader from '@/features/commentary/components/step-header';
import WrongToast from '@/features/commentary/components/wrong-toast';
import { HIT_R, LINK_AREA, type Point } from '@/features/commentary/constants/layout';
import { isSessionExpired } from '@/features/commentary/api/game-api';
import { useAnswerQuiz, useRequestQuiz } from '@/features/commentary/hooks/use-game-api';
import { useStage } from '@/features/commentary/hooks/use-stage';
import { dist, nodePositions, pairKey } from '@/features/commentary/utils/game-logic';

export type Pair = { from: number; to: number };
// 서버가 완성 그래프에 준 edgeId 가 있으면 3단계에서 선을 눌러 설명을 볼 수 있어요
export type LinkedEdge = Pair & { edgeId?: number };

type Props = {
  sessionId: string;
  nodes: GameNode[];
  categories: Category[];
  order: number[];
  onComplete: (edges: LinkedEdge[]) => void;
  onSessionExpired: () => void;
};

type Pending = Pair & {
  quizId: string;
  choices: QuizChoice[];
  // 정답을 맞힌 뒤 채워져요
  explain?: { description: string; stageComplete: boolean; edges?: LinkedEdge[] };
  phase: 'quiz' | 'explain';
};
type LineDragState = { from: number; origin: Point; at: Point; over: number | null };
type Toast = { title: string; sub: string } | null;

// 2단계 · 관계 잇기: 관계가 있는 별끼리 선을 긋고(/quiz) → 퀴즈(/quiz/answer) → 해설
export default function LinkStep({
  sessionId,
  nodes,
  categories,
  order,
  onComplete,
  onSessionExpired,
}: Props) {
  const stage = useStage();
  const requestQuiz = useRequestQuiz(sessionId);
  const answerQuiz = useAnswerQuiz(sessionId);
  const pos = useMemo(
    () => nodePositions(nodes, categories, order, LINK_AREA),
    [nodes, categories, order],
  );
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const [made, setMade] = useState<Pair[]>([]);
  const [drag, setDrag] = useState<LineDragState | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const dragRef = useRef<LineDragState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    stage.measure();
    return () => clearTimeout(toastTimer.current);
  }, [stage]);

  const showToast = (t: NonNullable<Toast>) => {
    setToast(t);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1500);
  };

  const nodeAt = (pt: Point, except: number) => {
    let best: number | null = null;
    let bestD = HIT_R;
    for (const n of nodes) {
      const p = pos[n.id];
      if (n.id === except || !p) continue;
      const d = dist(p, pt);
      if (d < bestD) {
        best = n.id;
        bestD = d;
      }
    }
    return best;
  };

  const connect = async (a: number, b: number) => {
    if (made.some((m) => pairKey(m.from, m.to) === pairKey(a, b))) {
      showToast({ title: '이미 이었어요!', sub: '다른 별을 이어볼까요?' });
      return;
    }
    try {
      const quiz = await requestQuiz.mutateAsync({ from: a, to: b });
      setPending({ from: a, to: b, quizId: quiz.quizId, choices: quiz.choices, phase: 'quiz' });
    } catch (e) {
      if (isSessionExpired(e)) {
        onSessionExpired();
      } else if (e instanceof ApiError && e.code === 'GAME_400_1') {
        showToast({ title: '아쉬워요!', sub: '이 두 별은 이어지지 않아요. 다른 별과 이어볼까요?' });
      } else if (e instanceof ApiError && e.code === 'GAME_409_2') {
        showToast({ title: '이미 이었어요!', sub: '다른 별을 이어볼까요?' });
      } else {
        showToast({ title: '앗!', sub: '잠시 후 다시 이어볼까요?' });
      }
    }
  };

  const tap = (id: number) => {
    if (selected == null) return setSelected(id);
    if (selected === id) return setSelected(null);
    const a = selected;
    setSelected(null);
    connect(a, id);
  };

  const setDragNow = (d: LineDragState | null) => {
    dragRef.current = d;
    setDrag(d);
  };
  const lineDrag: LineDrag = {
    blocked: pending != null || requestQuiz.isPending,
    tap,
    start: (id, px, py) => {
      stage.measure();
      const at = stage.toDesign(px, py);
      setDragNow({ from: id, origin: at, at, over: null });
    },
    move: (px, py) => {
      const d = dragRef.current;
      if (!d) return;
      const at = stage.toDesign(px, py);
      setDragNow({ ...d, at, over: nodeAt(at, d.from) });
    },
    end: (px, py) => {
      const d = dragRef.current;
      setDragNow(null);
      if (!d) return;
      const at = stage.toDesign(px, py);
      // 거의 안 움직이고 떼면 "톡"으로 봐요 (톡 · 톡으로도 이을 수 있어요).
      if (dist(at, d.origin) < 10) return tap(d.from);
      const target = nodeAt(at, d.from);
      setSelected(null);
      if (target != null) connect(d.from, target);
    },
    cancel: () => setDragNow(null),
  };

  const handleChoose = async (choiceId: number): Promise<ChooseResult> => {
    if (!pending) return 'error';
    try {
      const res = await answerQuiz.mutateAsync({ quizId: pending.quizId, choiceId });
      if (!res.correct) return 'wrong';
      setPending({
        ...pending,
        explain: {
          description: res.description ?? '',
          stageComplete: res.stageComplete,
          edges: res.graph?.edges,
        },
      });
      return 'correct';
    } catch (e) {
      if (isSessionExpired(e)) onSessionExpired();
      return 'error';
    }
  };

  const handleNext = () => {
    if (!pending?.explain) return;
    const next = [...made, { from: pending.from, to: pending.to }];
    const { stageComplete, edges } = pending.explain;
    setMade(next);
    setPending(null);
    if (stageComplete) setTimeout(() => onComplete(edges ?? next), 650);
  };

  const seg = (p: Pair): [Point, Point] => [pos[p.from], pos[p.to]];
  const from = pending ? byId.get(pending.from) : undefined;
  const to = pending ? byId.get(pending.to) : undefined;

  return (
    <>
      <StepHeader
        step={2}
        title="이야기 별자리를 완성해요!"
        sub="관계가 있는 카드끼리 선으로 이어요"
      />
      <Baskets categories={categories} area={LINK_AREA} />
      <LinkLines
        segments={made.map(seg)}
        pending={pending ? seg(pending) : null}
        drag={drag ? [pos[drag.from], drag.over != null ? pos[drag.over] : drag.at] : null}
      />
      {nodes.map((n) =>
        pos[n.id] ? (
          <DraggableNode
            key={n.id}
            node={n}
            at={pos[n.id]}
            selected={selected === n.id || drag?.from === n.id || drag?.over === n.id}
            drag={lineDrag}
          />
        ) : null,
      )}
      <WrongToast visible={toast != null} title={toast?.title} sub={toast?.sub} />

      {pending?.phase === 'quiz' && from && to ? (
        <QuizModal
          from={from}
          to={to}
          choices={pending.choices}
          onChoose={handleChoose}
          onCorrect={() => setPending((p) => (p ? { ...p, phase: 'explain' } : p))}
          onClose={() => setPending(null)}
        />
      ) : null}
      {pending?.phase === 'explain' && pending.explain && from && to ? (
        <ExplainModal
          from={from}
          to={to}
          description={pending.explain.description}
          onNext={handleNext}
        />
      ) : null}
    </>
  );
}
