import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import GlassIconButton from '@/components/ui/glass-icon-button';
import Stage from '@/components/ui/stage';
import { SCREEN } from '@/constants/layout';
import type { Category, GameNode } from '@/features/commentary/api/types';
import CanvasFrame from '@/features/commentary/components/canvas-frame';
import ClassifyStep, { type ClassifyResult } from '@/features/commentary/components/classify-step';
import FadeIn from '@/features/commentary/components/fade-in';
import GraphSkeleton from '@/features/commentary/components/graph-skeleton';
import LinkStep from '@/features/commentary/components/link-step';
import StatusPanel from '@/features/commentary/components/status-panel';
import { CLASSIFY_AREA } from '@/features/commentary/constants/board';
import { MOTION } from '@/features/commentary/constants/motion';
import { useStartGame } from '@/features/commentary/hooks/use-game-api';
import { ApiError } from '@/lib/api-client';

const CATEGORIES: Category[] = ['등장인물', '장소', '사건', '교훈'];

type Props = { fairytaleId: number; onHome: () => void };

/**
 * 독후 활동 (관계도 게임)
 *  1. 분류하기  – 별 카드를 바구니(등장인물 · 장소 · 사건 · 교훈)에 드래그 & 드롭
 *  2. 관계 잇기 – 관계가 있는 별끼리 선 긋기 → 관계 퀴즈 → 해설
 *  3. 별자리 완성
 */
export default function CommentaryScreen({ fairytaleId, onHome }: Props) {
  const { mutate: start, data: game, error, isPending: starting } = useStartGame();
  const [step, setStep] = useState<'classify' | 'link'>('classify');
  const [classified, setClassified] = useState<ClassifyResult>({ placement: {} });
  // 게임 도중 서버 세션이 사라졌어요(GAME_404_1) → 처음부터 다시 시작해야 해요
  const [expired, setExpired] = useState(false);
  const leave = useState(() => new Animated.Value(1))[0];

  useEffect(() => {
    start(fairytaleId);
  }, [start, fairytaleId]);

  const restart = () => {
    setExpired(false);
    setStep('classify');
    setClassified({ placement: {} });
    start(fairytaleId);
  };

  // 메인으로: 디졸브 0.3s 뒤 이동
  const handleHome = () => {
    Animated.timing(leave, {
      toValue: 0,
      duration: MOTION.dissolve,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => onHome());
  };

  const renderContent = () => {
    if (error) {
      const notReady = error instanceof ApiError && error.code === 'GAME_404_3';
      return (
        <StatusPanel
          title={notReady ? '관계도를 준비하고 있어요' : '관계도를 불러오지 못했어요'}
          sub={notReady ? '조금만 기다렸다가 다시 눌러 주세요!' : '잠시 후 다시 시도해 주세요.'}
          onRetry={() => start(fairytaleId)}
        />
      );
    }
    if (expired) {
      return (
        <StatusPanel
          title="시간이 지나서 게임이 끝났어요"
          sub="처음부터 다시 해볼까요?"
          onRetry={restart}
        />
      );
    }
    if (!game || starting) return <GraphSkeleton categories={CATEGORIES} area={CLASSIFY_AREA} />;
    const { sessionId, question } = game;
    const categories = question.categories.length ? question.categories : CATEGORIES;
    if (step === 'classify') {
      return (
        <ClassifyStep
          key={sessionId}
          sessionId={sessionId}
          nodes={question.nodes}
          categories={categories}
          onComplete={(result) => {
            setClassified(result);
            setStep('link');
          }}
          onSessionExpired={() => setExpired(true)}
        />
      );
    }
    // 2단계부터는 1단계 완료 응답이 준 노드를 써요 (없으면 /start 의 노드)
    const linkNodes: GameNode[] = classified.nextNodes ?? question.nodes;
    return (
      <LinkStep
        key={sessionId}
        sessionId={sessionId}
        nodes={linkNodes}
        categories={categories}
        placement={classified.placement}
        // 3단계(별자리 완성)는 다음 PR 에서 이어요. 지금은 모두 이으면 메인으로 돌아가요.
        onComplete={handleHome}
        onSessionExpired={() => setExpired(true)}
      />
    );
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <Stage>
        <CanvasFrame>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: leave }]}>
            {/* 메인 버튼은 모달 아래에 깔려야 해서 단계 화면보다 먼저 그려요 */}
            <View style={styles.home}>
              <GlassIconButton icon="home" label="메인으로" onPress={handleHome} />
            </View>
            <FadeIn key={step}>{renderContent()}</FadeIn>
          </Animated.View>
        </CanvasFrame>
      </Stage>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  home: { position: 'absolute', left: SCREEN.homeButtonX, top: SCREEN.topBarY },
});
