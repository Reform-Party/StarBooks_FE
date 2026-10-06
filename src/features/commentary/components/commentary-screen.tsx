import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ApiError } from '@/features/commentary/api/api-client';
import ClassifyStep from '@/features/commentary/components/classify-step';
import CompleteStep from '@/features/commentary/components/complete-step';
import GlassIconButton from '@/features/commentary/components/glass-icon-button';
import LinkStep, { type Pair } from '@/features/commentary/components/link-step';
import Sky from '@/features/commentary/components/sky';
import Stage from '@/features/commentary/components/stage';
import StatusPanel from '@/features/commentary/components/status-panel';
import { COMMENTARY_FONTS } from '@/features/commentary/constants/fonts';
import { HOME_BTN } from '@/features/commentary/constants/layout';
import { useGameGraph, useStartGame } from '@/features/commentary/hooks/use-game-api';
import type { Category } from '@/features/commentary/api/types';

const CATEGORIES: Category[] = ['등장인물', '장소', '사건', '교훈'];

type Props = { fairytaleId: number; onHome: () => void };

/**
 * 독후 활동 (관계도 게임)
 *  1. 분류하기  – 별 카드를 바구니(등장인물 · 장소 · 사건 · 교훈)에 드래그 & 드롭
 *  2. 관계 잇기 – 관계가 있는 별끼리 선 긋기 → 관계 퀴즈 → 해설
 *  3. 별자리 완성
 */
export default function CommentaryScreen({ fairytaleId, onHome }: Props) {
  const [fontsLoaded] = useFonts(COMMENTARY_FONTS);
  const { mutate: start, data: game, error } = useStartGame();
  const [step, setStep] = useState<'classify' | 'link' | 'complete'>('classify');
  const [order, setOrder] = useState<number[]>([]);
  const [edges, setEdges] = useState<Pair[]>([]);

  useEffect(() => {
    start(fairytaleId);
  }, [start, fairytaleId]);

  // 이미 끝낸 게임(409)이면 완성된 관계도를 보여줘요.
  const finished = error instanceof ApiError && error.code === 'GAME_409_1';
  const graph = useGameGraph(fairytaleId, finished);

  if (!fontsLoaded) return null;

  const renderContent = () => {
    if (finished) {
      return graph.data ? (
        <CompleteStep
          nodes={graph.data.nodes}
          categories={CATEGORIES}
          order={[]}
          edges={graph.data.edges}
          onHome={onHome}
        />
      ) : null;
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
    if (!game) return null;
    const { sessionId, question } = game;
    const categories = question.categories.length ? question.categories : CATEGORIES;
    if (step === 'classify') {
      return (
        <ClassifyStep
          sessionId={sessionId}
          nodes={question.nodes}
          categories={categories}
          onComplete={(placed) => {
            setOrder(placed);
            setStep('link');
          }}
        />
      );
    }
    if (step === 'link') {
      return (
        <LinkStep
          sessionId={sessionId}
          nodes={question.nodes}
          categories={categories}
          order={order}
          onComplete={(linked) => {
            setEdges(linked);
            setStep('complete');
          }}
        />
      );
    }
    return (
      <CompleteStep
        nodes={question.nodes}
        categories={categories}
        order={order}
        edges={edges}
        onHome={onHome}
      />
    );
  };

  return (
    <Stage>
      <Sky dim />
      {/* 메인 버튼은 모달 아래에 깔려야 해서 단계 화면보다 먼저 그려요 */}
      <View style={styles.home}>
        <GlassIconButton icon="home" size={HOME_BTN.size} label="메인으로" onPress={onHome} />
      </View>
      {renderContent()}
    </Stage>
  );
}

const styles = StyleSheet.create({
  home: { position: 'absolute', left: HOME_BTN.left, top: HOME_BTN.top },
});
