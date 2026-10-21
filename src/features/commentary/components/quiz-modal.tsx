import { useState } from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import type { GameNode, QuizChoice } from '@/features/commentary/api/types';
import Text from '@/features/commentary/components/app-text';
import CenterModal from '@/features/commentary/components/center-modal';
import GlassIconButton from '@/features/commentary/components/glass-icon-button';
import JellyButton from '@/features/commentary/components/jelly-button';
import QuizPairStar from '@/features/commentary/components/quiz-pair-star';
import { GLASS, SPACE, STAR } from '@/features/commentary/constants/theme';
import { TYPE } from '@/features/commentary/constants/typography';
import { shake, shakeX } from '@/features/commentary/hooks/use-motion';
import { CATEGORY_COLOR } from '@/features/commentary/utils/game-logic';

export type ChooseResult = 'correct' | 'wrong' | 'error';

type Props = {
  from: GameNode;
  to: GameNode;
  // 서버가 섞어서 보내준 3지선다
  choices: QuizChoice[];
  // 오답 · 오류 배너는 부모(관계 잇기 화면)가 모달 위에 띄워요
  onChoose: (choiceId: number) => Promise<ChooseResult>;
  onCorrect: () => void;
  onClose: () => void;
};

const PANEL_W = 420;
const PANEL_TOP = 38;
// 선택지는 서버가 만든 문장이라 길이를 알 수 없어요. 두 줄까지 보여주고, 그래도 넘치면 목록이 스크롤돼요.
const CHOICES_MAX_H = 176;

// 관계 퀴즈 (디자인 c2-quiz): 두 별 사이가 어떤 관계인지 고르기
export default function QuizModal({ from, to, choices, onChoose, onCorrect, onClose }: Props) {
  const [wrongs, setWrongs] = useState<number[]>([]);
  const [right, setRight] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [shakes] = useState(() => new Map(choices.map((c) => [c.choiceId, new Animated.Value(0)])));
  const shakeOf = (id: number) => shakes.get(id) ?? new Animated.Value(0);

  const handleChoose = async (choiceId: number) => {
    if (busy || right != null || wrongs.includes(choiceId)) return;
    setBusy(true);
    const result = await onChoose(choiceId);
    setBusy(false);
    if (result === 'correct') {
      setRight(choiceId);
      setTimeout(onCorrect, 380);
    } else if (result === 'wrong') {
      setWrongs((w) => [...w, choiceId]);
      shake(shakeOf(choiceId));
    }
  };

  return (
    <CenterModal width={PANEL_W} top={PANEL_TOP} style={styles.panel}>
      {/* 응답을 기다리는 동안 닫으면 늦게 온 정답이 모달을 다시 열 수 있어서 막아요 */}
      <GlassIconButton
        icon="x"
        size={32}
        label="닫기"
        disabled={busy || right != null}
        onPress={onClose}
        style={styles.close}
      />
      <Text style={TYPE.h2}>어떤 관계일까요?</Text>
      <View style={styles.pair}>
        <QuizPairStar color={CATEGORY_COLOR[from.category]} name={from.word} />
        <View style={styles.bar}>
          <Svg width={44} height={3}>
            <Defs>
              <LinearGradient id="quiz-pair" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={STAR.mint.c300} />
                <Stop offset="1" stopColor={STAR.yellow.c300} />
              </LinearGradient>
            </Defs>
            <Rect width={44} height={3} rx={1.5} fill="url(#quiz-pair)" />
          </Svg>
        </View>
        <QuizPairStar color={CATEGORY_COLOR[to.category]} name={to.word} />
      </View>
      <ScrollView
        style={styles.choices}
        contentContainerStyle={styles.choicesContent}
        showsVerticalScrollIndicator={false}
      >
        {choices.map((c) => {
          const isWrong = wrongs.includes(c.choiceId);
          return (
            <Animated.View key={c.choiceId} style={[styles.choice, shakeX(shakeOf(c.choiceId))]}>
              <JellyButton
                tone={right === c.choiceId ? 'mint' : 'glass'}
                minHeight={42}
                numberOfLines={2}
                fontSize={17.5}
                onPress={() => handleChoose(c.choiceId)}
                accessibilityLabel={`${c.content}${isWrong ? ', 틀렸어요' : ''}`}
                style={[styles.choiceBtn, isWrong && styles.wrongBtn]}
              >
                {c.content}
              </JellyButton>
            </Animated.View>
          );
        })}
      </ScrollView>
    </CenterModal>
  );
}

const styles = StyleSheet.create({
  panel: {
    paddingVertical: SPACE.xl,
    paddingHorizontal: SPACE.xl,
    alignItems: 'center',
    gap: SPACE.m,
  },
  close: { position: 'absolute', left: PANEL_W - 44, top: SPACE.m },
  pair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xxs,
    paddingVertical: SPACE.xs,
    paddingHorizontal: SPACE.m,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: GLASS.line,
  },
  bar: { marginBottom: SPACE.l },
  choices: { width: '100%', maxHeight: CHOICES_MAX_H, flexGrow: 0 },
  choicesContent: { gap: SPACE.s },
  choice: { width: '100%' },
  choiceBtn: { width: '100%', paddingHorizontal: SPACE.l, paddingVertical: SPACE.xs },
  wrongBtn: {
    backgroundColor: 'rgba(244,114,182,0.22)',
    borderColor: STAR.pink.rim,
    opacity: 0.75,
  },
});
