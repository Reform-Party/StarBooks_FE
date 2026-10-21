import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ApiError } from '@/features/commentary/api/api-client';
import type { Category, GameNode } from '@/features/commentary/api/types';
import { FontsReadyContext } from '@/features/commentary/components/app-text';
import ClassifyStep, { type ClassifyResult } from '@/features/commentary/components/classify-step';
import CompleteStep from '@/features/commentary/components/complete-step';
import FadeIn from '@/features/commentary/components/fade-in';
import GlassIconButton from '@/features/commentary/components/glass-icon-button';
import GraphSkeleton from '@/features/commentary/components/graph-skeleton';
import LinkStep, { type LinkResult } from '@/features/commentary/components/link-step';
import Sky from '@/features/commentary/components/sky';
import Stage from '@/features/commentary/components/stage';
import StatusPanel from '@/features/commentary/components/status-panel';
import { COMMENTARY_FONTS } from '@/features/commentary/constants/fonts';
import { CLASSIFY_AREA, HOME_BTN, LINK_AREA } from '@/features/commentary/constants/layout';
import { MOTION } from '@/features/commentary/constants/motion';
import { useGameGraph, useStartGame } from '@/features/commentary/hooks/use-game-api';

const CATEGORIES: Category[] = ['등장인물', '장소', '사건', '교훈'];

type Props = { fairytaleId: number; onHome: () => void };

/**
 * 독후 활동 (관계도 게임)
 *  1. 분류하기  – 별 카드를 바구니(등장인물 · 장소 · 사건 · 교훈)에 드래그 & 드롭
 *  2. 관계 잇기 – 관계가 있는 별끼리 선 긋기 → 관계 퀴즈 → 해설
 *  3. 별자리 완성
 */
export default function CommentaryScreen({ fairytaleId, onHome }: Props) {
  // 글꼴을 못 불러와도 화면은 그려요 (시스템 글꼴로)
  const [fontsLoaded, fontError] = useFonts(COMMENTARY_FONTS);
  const { mutate: start, data: game, error, isPending: starting } = useStartGame();
  const [step, setStep] = useState<'classify' | 'link' | 'complete'>('classify');
  const [classified, setClassified] = useState<ClassifyResult>({ placement: {} });
  const [linked, setLinked] = useState<LinkResult>({ edges: [], placement: {} });
  // 게임 도중 서버 세션이 사라졌어요(GAME_404_1) → 처음부터 다시 시작해야 해요
  const [expired, setExpired] = useState(false);
  const leave = useState(() => new Animated.Value(1))[0];

  useEffect(() => {
    start(fairytaleId);
  }, [start, fairytaleId]);

  // 이미 끝낸 게임(409)이면 완성된 관계도를 보여줘요.
  const finished = error instanceof ApiError && error.code === 'GAME_409_1';
  const graph = useGameGraph(fairytaleId, finished);

  if (!fontsLoaded && !fontError) return null;

  const restart = () => {
    setExpired(false);
    setStep('classify');
    setClassified({ placement: {} });
    setLinked({ edges: [], placement: {} });
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
    if (finished) {
      if (graph.isError) {
        return (
          <StatusPanel
            title="관계도를 불러오지 못했어요"
            sub="잠시 후 다시 시도해 주세요."
            onRetry={() => graph.refetch()}
          />
        );
      }
      if (!graph.data) return <GraphSkeleton categories={CATEGORIES} area={LINK_AREA} />;
      return (
        <CompleteStep
          nodes={graph.data.nodes}
          categories={CATEGORIES}
          placement={{}}
          edges={graph.data.edges}
          onHome={handleHome}
        />
      );
    }
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
    // 2단계부터는 1단계 완료 응답이 준 노드를 써요 (없으면 /start 의 노드)
    const linkNodes: GameNode[] = classified.nextNodes ?? question.nodes;
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
    if (step === 'link') {
      return (
        <LinkStep
          key={sessionId}
          sessionId={sessionId}
          nodes={linkNodes}
          categories={categories}
          placement={classified.placement}
          onComplete={(result) => {
            setLinked(result);
            setStep('complete');
          }}
          onSessionExpired={() => setExpired(true)}
        />
      );
    }
    return (
      <CompleteStep
        nodes={linkNodes}
        categories={categories}
        placement={linked.placement}
        edges={linked.edges}
        onHome={handleHome}
      />
    );
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <FontsReadyContext.Provider value={fontsLoaded}>
        <Stage>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: leave }]}>
            <Sky dim />
            {/* 메인 버튼은 모달 아래에 깔려야 해서 단계 화면보다 먼저 그려요 */}
            <View style={styles.home}>
              <GlassIconButton
                icon="home"
                size={HOME_BTN.size}
                label="메인으로"
                onPress={handleHome}
              />
            </View>
            <FadeIn key={step}>{renderContent()}</FadeIn>
          </Animated.View>
        </Stage>
      </FontsReadyContext.Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  home: { position: 'absolute', left: HOME_BTN.left, top: HOME_BTN.top },
});
