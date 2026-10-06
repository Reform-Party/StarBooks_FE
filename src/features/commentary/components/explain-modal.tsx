import { StyleSheet, Text, View } from 'react-native';

import type { GameNode } from '@/features/commentary/api/types';
import CenterModal from '@/features/commentary/components/center-modal';
import GlassIconButton from '@/features/commentary/components/glass-icon-button';
import Icon from '@/features/commentary/components/icon';
import JellyButton from '@/features/commentary/components/jelly-button';
import JellyStar from '@/features/commentary/components/jelly-star';
import { FONT, PAPER, STAR } from '@/features/commentary/constants/theme';
import { TYPE } from '@/features/commentary/constants/typography';
import { CATEGORY_COLOR, parseMarked } from '@/features/commentary/utils/game-logic';

type Props = {
  from: GameNode;
  to: GameNode;
  description: string;
  onNext: () => void;
  // 'close': 3단계에서 선을 눌러 다시 볼 때 — 버튼이 "닫기"가 돼요
  action?: 'next' | 'close';
};

// 관계 해설 (디자인 c2-explain): 종이 카드에 "A → B" + 서버가 준 관계 설명
export default function ExplainModal({ from, to, description, onNext, action = 'next' }: Props) {
  return (
    <CenterModal width={520} top={58} style={styles.panel}>
      <GlassIconButton icon="x" size={32} label="닫기" onPress={onNext} style={styles.close} />
      <View style={styles.paper} accessible accessibilityLabel={`${from.word}에서 ${to.word}으로`}>
        <JellyStar color={CATEGORY_COLOR[from.category]} size={26} glow={false} />
        <Text style={styles.paperText}>{from.word}</Text>
        <Icon name="arrow" size={22} color={STAR.mint.c500} />
        <Text style={styles.paperText}>{to.word}</Text>
        <JellyStar color={CATEGORY_COLOR[to.category]} size={26} glow={false} />
      </View>
      <Text style={[TYPE.bodyL, styles.body]}>
        {parseMarked(description).map((seg, i) => (
          <Text key={i} style={seg.mark ? styles.mark : undefined}>
            {seg.text}
          </Text>
        ))}
      </Text>
      <JellyButton tone="yellow" minWidth={150} onPress={onNext}>
        {action === 'close' ? '닫기' : '다음'}
        {action === 'next' ? <Icon name="right" size={16} color={STAR.yellow.on} /> : null}
      </JellyButton>
    </CenterModal>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 24, alignItems: 'center', gap: 14 },
  close: { position: 'absolute', left: 476, top: 12 },
  paper: {
    maxWidth: 470,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: PAPER.fill,
    borderBottomWidth: 4,
    borderBottomColor: PAPER.edge,
  },
  paperText: { fontFamily: FONT.hand, fontSize: 31, lineHeight: 36, color: PAPER.ink },
  body: { maxWidth: 330, textAlign: 'center' },
  mark: {
    color: STAR.yellow.ink,
    textShadowColor: 'rgba(245,158,11,0.8)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 1 },
  },
});
