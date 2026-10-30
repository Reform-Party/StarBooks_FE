import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { ApiError } from '@/lib/api-client';
import { isSessionExpired } from '@/features/commentary/api/game-api';
import type { Category, GameNode, GraphEdge, QuizChoice } from '@/features/commentary/api/types';
import Baskets from '@/features/commentary/components/baskets';
import DragLine from '@/features/commentary/components/drag-line';
import ExplainModal from '@/features/commentary/components/explain-modal';
import GestureStar, {
  type LineDrag,
  type LineTarget,
} from '@/features/commentary/components/gesture-star';
import LinkLines from '@/features/commentary/components/link-lines';
import { TRAY_FRAME } from '@/features/commentary/components/node-tray';
import QuizModal, { type ChooseResult } from '@/features/commentary/components/quiz-modal';
import StepHeader from '@/features/commentary/components/step-header';
import WrongToast from '@/features/commentary/components/wrong-toast';
import { SCREEN } from '@/constants/layout';
import { CLASSIFY_AREA, LINK_AREA, type Point, TRAY } from '@/features/commentary/constants/board';
import { MOTION } from '@/features/commentary/constants/motion';
import { type Banner, useBanner } from '@/features/commentary/hooks/use-banner';
import { useAnswerQuiz, useRequestQuiz } from '@/features/commentary/hooks/use-game-api';
import { useScreenShake } from '@/features/commentary/hooks/use-motion';
import { useCanvas } from '@/features/commentary/hooks/use-canvas';
import {
  nodePositions,
  pairKey,
  type Placement,
  pointToSpot,
} from '@/features/commentary/utils/game-logic';
import { haptic } from '@/features/commentary/utils/haptics';

export type Pair = { from: number; to: number };
// 서버가 완성 그래프에 준 edgeId 가 있으면 3단계에서 선을 눌러 설명을 볼 수 있어요
export type LinkedEdge = GraphEdge;
export type LinkResult = { edges: LinkedEdge[]; placement: Placement };

type Props = {
  sessionId: string;
  nodes: GameNode[];
  categories: Category[];
  placement: Placement;
  onComplete: (result: LinkResult) => void;
  onSessionExpired: () => void;
};

type Pending = Pair & {
  quizId: string;
  choices: QuizChoice[];
  // 정답을 맞힌 뒤 채워져요
  explain?: { description: string; stageComplete: boolean; edges?: LinkedEdge[] };
  phase: 'quiz' | 'explain';
};
type Made = Pair & { fresh: boolean };

// 2단계 · 관계 잇기: 관계가 있는 별끼리 선을 긋고(/quiz) → 퀴즈(/quiz/answer) → 해설
export default function LinkStep({
  sessionId,
  nodes,
  categories,
  placement: initialPlacement,
  onComplete,
  onSessionExpired,
}: Props) {
  const stage = useCanvas();
  const requestQuiz = useRequestQuiz(sessionId);
  const answerQuiz = useAnswerQuiz(sessionId);
  const shake = useScreenShake();
  const [placement, setPlacement] = useState(initialPlacement);
  // 처음엔 1단계 크기로 그렸다가, 트레이가 내려가며 2단계 크기로 늘어나요
  const [entered, setEntered] = useState(false);
  const [made, setMade] = useState<Made[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [over, setOver] = useState(-1);
  const [pending, setPending] = useState<Pending | null>(null);
  // 모두 이어 3단계로 넘어가는 중 (그 사이 다시 잇지 못하게)
  const [finishing, setFinishing] = useState(false);
  // 퀴즈 위에 뜬 배너인지 (사라지는 동안에도 같은 자리에 있어야 해서 따로 둬요)
  const [raised, setRaised] = useState(false);
  const banner = useBanner();
  const [wrongPair, setWrongPair] = useState<Pair | null>(null);
  const grow = useState(() => new Animated.Value(0))[0];
  const tint = useState(() => new Animated.Value(0))[0];
  const wrongLine = useState(() => new Animated.Value(0))[0];
  const finishTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // /quiz 요청이 진행 중이면 다음 잇기를 막아요. 렌더 전에 두 번 불려도 막히게 ref 로 둬요.
  const connecting = useRef(false);
  // 지금 열려 있는 퀴즈. 응답을 기다리는 사이 닫히거나 바뀌면 늦게 온 응답을 버려요.
  const activeQuiz = useRef<string | null>(null);

  const area = entered ? LINK_AREA : CLASSIFY_AREA;
  const pos = useMemo(
    () => nodePositions(nodes, categories, placement, area),
    [nodes, categories, placement, area],
  );
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const lineFrom = useSharedValue(-1);
  const lineEnd = useSharedValue<Point>({ x: 0, y: 0 });
  const lineOver = useSharedValue(-1);
  const targets = useSharedValue<LineTarget[]>([]);

  useEffect(() => {
    stage.measure();
    Animated.timing(grow, {
      toValue: 1,
      duration: MOTION.trayHide,
      useNativeDriver: false,
    }).start();
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(finishTimer.current);
    };
  }, [stage, grow]);

  useEffect(() => {
    targets.set(Object.entries(pos).map(([id, p]) => ({ id: Number(id), x: p.x, y: p.y })));
  }, [pos, targets]);

  const showToast = (next: Banner & { raised?: boolean }) => {
    setRaised(next.raised ?? false);
    banner.show(next);
  };

  // 틀린 관계: 붉게 + 흔들림 + 배너 · 선 사라짐 0.3s
  const playWrongPair = (pair: Pair) => {
    setWrongPair(pair);
    tint.setValue(0);
    wrongLine.setValue(1);
    shake.run();
    Animated.parallel([
      Animated.sequence([
        Animated.timing(tint, { toValue: 1, duration: MOTION.tint / 2, useNativeDriver: true }),
        Animated.timing(tint, { toValue: 0, duration: MOTION.tint / 2, useNativeDriver: true }),
      ]),
      Animated.timing(wrongLine, { toValue: 0, duration: MOTION.shake, useNativeDriver: true }),
    ]).start(() => setWrongPair(null));
    showToast({ sub: '다시 생각해 볼까요?' });
  };

  const connect = async (a: number, b: number) => {
    if (connecting.current || finishing) return;
    if (made.some((m) => pairKey(m.from, m.to) === pairKey(a, b))) {
      showToast({ title: '이미 이었어요!', sub: '다른 별을 이어볼까요?' });
      return;
    }
    connecting.current = true;
    try {
      const quiz = await requestQuiz.mutateAsync({ from: a, to: b });
      activeQuiz.current = quiz.quizId;
      setPending({ from: a, to: b, quizId: quiz.quizId, choices: quiz.choices, phase: 'quiz' });
    } catch (e) {
      if (isSessionExpired(e)) {
        onSessionExpired();
      } else if (e instanceof ApiError && e.code === 'GAME_400_1') {
        playWrongPair({ from: a, to: b });
      } else if (e instanceof ApiError && e.code === 'GAME_409_2') {
        showToast({ title: '이미 이었어요!', sub: '다른 별을 이어볼까요?' });
      } else {
        showToast({ title: '앗!', sub: '잠시 후 다시 이어볼까요?' });
      }
    } finally {
      connecting.current = false;
    }
  };

  const blocked = pending != null || requestQuiz.isPending || finishing;

  const handleTap = (id: number) => {
    if (blocked) return;
    if (selected == null) return setSelected(id);
    if (selected === id) return setSelected(null);
    const a = selected;
    setSelected(null);
    connect(a, id);
  };

  const lineDrag: LineDrag = {
    frame: stage.frame,
    from: lineFrom,
    end: lineEnd,
    over: lineOver,
    targets,
    onOver: setOver,
    onRelease: (from, to) => {
      setSelected(null);
      if (to >= 0 && !blocked) connect(from, to);
    },
    onTap: handleTap,
  };

  const handleChoose = async (quiz: Pending, choiceId: number): Promise<ChooseResult> => {
    const { quizId, from, to } = quiz;
    try {
      const res = await answerQuiz.mutateAsync({ quizId, choiceId });
      // 응답을 기다리는 사이 퀴즈가 닫혔거나 바뀌었으면 반영하지 않아요
      if (activeQuiz.current !== quizId) return 'error';
      if (!res.correct) {
        showToast({ sub: '다른 답을 골라볼까요?', raised: true });
        return 'wrong';
      }
      const explain = {
        description: res.description ?? '',
        stageComplete: res.stageComplete,
        edges: res.graph?.edges,
      };
      setPending((p) => (p?.quizId === quizId ? { ...p, explain } : p));
      // 올바른 관계: 선 확정(0.25s 그리기) + 햅틱 1회 → 관계 해설
      setMade((m) => [...m, { from, to, fresh: true }]);
      haptic('confirm');
      return 'correct';
    } catch (e) {
      if (isSessionExpired(e)) onSessionExpired();
      else showToast({ title: '앗!', sub: '잠시 후 다시 골라볼까요?', raised: true });
      return 'error';
    }
  };

  const handleExplain = () => {
    setPending((p) => (p ? { ...p, phase: 'explain' } : p));
    haptic('tap');
  };

  const handleNext = () => {
    if (!pending?.explain) return;
    const { stageComplete, edges } = pending.explain;
    activeQuiz.current = null;
    setPending(null);
    if (stageComplete) {
      // 마지막 해설을 닫고 0.65s 뒤 3단계로. 그 사이에는 별을 잇지 못하게 막아요.
      setFinishing(true);
      const result = { edges: edges ?? made.map(({ from, to }) => ({ from, to })), placement };
      finishTimer.current = setTimeout(() => onComplete(result), 650);
    }
  };

  const handleMoved = (id: number, at: Point) =>
    setPlacement((p) => {
      const spot = p[id];
      return spot ? { ...p, [id]: pointToSpot(at, spot.basket, LINK_AREA) } : p;
    });

  const from = pending ? byId.get(pending.from) : undefined;
  const to = pending ? byId.get(pending.to) : undefined;
  const quizLine =
    pending && !pending.explain && pos[pending.from] && pos[pending.to]
      ? ([pos[pending.from], pos[pending.to]] as [Point, Point])
      : null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, shake.style]} pointerEvents="box-none">
      <StepHeader
        step={2}
        title="이야기 별자리를 완성해요!"
        sub="관계가 있는 카드끼리 선으로 이어요"
      />
      <Baskets
        categories={categories}
        area={LINK_AREA}
        grow={{ from: CLASSIFY_AREA, progress: grow }}
      />
      {/* 2단계 진입: 빈 트레이가 아래로 사라져요 (0.35s) */}
      <Animated.View
        pointerEvents="none"
        style={[
          TRAY_FRAME,
          {
            opacity: grow.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            transform: [
              {
                translateY: grow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, SCREEN.height - TRAY.top],
                }),
              },
            ],
          },
        ]}
      />
      <LinkLines
        segments={made
          .filter((m) => pos[m.from] && pos[m.to])
          .map((m) => ({
            key: pairKey(m.from, m.to),
            a: pos[m.from],
            b: pos[m.to],
            fresh: m.fresh,
          }))}
        pending={quizLine}
        wrong={
          wrongPair && pos[wrongPair.from] && pos[wrongPair.to]
            ? { seg: [pos[wrongPair.from], pos[wrongPair.to]], opacity: wrongLine }
            : null
        }
      />
      <DragLine drag={lineDrag} />
      {nodes.map((n) => {
        const p = pos[n.id];
        const spot = placement[n.id];
        if (!p) return null;
        const isWrong = wrongPair?.from === n.id || wrongPair?.to === n.id;
        return (
          <GestureStar
            key={n.id}
            node={n}
            basket={spot?.basket ?? categories.indexOf(n.category)}
            area={LINK_AREA}
            cx={p.x}
            cy={p.y}
            selected={selected === n.id || over === n.id}
            tint={isWrong ? tint : undefined}
            blocked={blocked}
            line={lineDrag}
            accessibilityLabel={`${n.word} 별. 두 별을 차례로 눌러 이어요`}
            onMoved={handleMoved}
          />
        );
      })}

      {pending?.phase === 'quiz' && from && to ? (
        <QuizModal
          key={pending.quizId}
          from={from}
          to={to}
          choices={pending.choices}
          onChoose={(choiceId) => handleChoose(pending, choiceId)}
          onCorrect={handleExplain}
          onClose={() => {
            activeQuiz.current = null;
            setPending(null);
          }}
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
      <WrongToast
        visible={banner.visible}
        title={banner.banner.title}
        sub={banner.banner.sub}
        raised={raised}
      />
    </Animated.View>
  );
}
