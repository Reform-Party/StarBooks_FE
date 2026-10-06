import { useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import type { GameNode, QuizChoice } from '@/features/commentary/api/types';
import CenterModal from '@/features/commentary/components/center-modal';
import GlassIconButton from '@/features/commentary/components/glass-icon-button';
import JellyButton from '@/features/commentary/components/jelly-button';
import QuizPairStar from '@/features/commentary/components/quiz-pair-star';
import { FONT, GLASS, STAR } from '@/features/commentary/constants/theme';
import { TYPE } from '@/features/commentary/constants/typography';
import { wobble } from '@/features/commentary/hooks/use-motion';
import { CATEGORY_COLOR } from '@/features/commentary/utils/game-logic';

export type ChooseResult = 'correct' | 'wrong' | 'error';

type Props = {
  from: GameNode;
  to: GameNode;
  // 서버가 섞어서 보내준 3지선다
  choices: QuizChoice[];
  onChoose: (choiceId: number) => Promise<ChooseResult>;
  onCorrect: () => void;
  onClose: () => void;
};

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
      wobble(shakeOf(choiceId));
    }
  };

  return (
    <CenterModal width={420} top={38} style={styles.panel}>
      <GlassIconButton icon="x" size={32} label="닫기" onPress={onClose} style={styles.close} />
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
      {choices.map((c) => {
        const isWrong = wrongs.includes(c.choiceId);
        return (
          <Animated.View
            key={c.choiceId}
            style={[
              styles.choice,
              {
                transform: [
                  {
                    translateX: shakeOf(c.choiceId).interpolate({
                      inputRange: [-1, 1],
                      outputRange: [-6, 6],
                    }),
                  },
                ],
              },
            ]}
          >
            <JellyButton
              tone={right === c.choiceId ? 'mint' : 'glass'}
              height={42}
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
      <Text
        accessibilityLiveRegion="polite"
        style={[styles.hint, !(wrongs.length > 0 && right == null) && styles.hintHidden]}
      >
        아쉬워요! 다른 답을 골라볼까요?
      </Text>
    </CenterModal>
  );
}

const styles = StyleSheet.create({
  panel: { paddingVertical: 20, paddingHorizontal: 26, alignItems: 'center', gap: 10 },
  close: { position: 'absolute', left: 376, top: 12 },
  pair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: GLASS.line,
  },
  bar: { marginBottom: 16 },
  choice: { width: '100%' },
  choiceBtn: { width: '100%', paddingHorizontal: 14 },
  wrongBtn: {
    backgroundColor: 'rgba(244,114,182,0.22)',
    borderColor: STAR.pink.rim,
    opacity: 0.75,
  },
  hint: { fontFamily: FONT.sansBold, fontSize: 15, color: STAR.pink.ink, marginTop: -2 },
  hintHidden: { opacity: 0 },
});
