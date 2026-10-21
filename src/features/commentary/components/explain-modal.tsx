import { ScrollView, StyleSheet, View } from 'react-native';

import CenterModal from '@/components/ui/center-modal';
import GlassIconButton from '@/components/ui/glass-icon-button';
import Icon from '@/components/ui/icon';
import JellyButton from '@/components/ui/jelly-button';
import JellyStar from '@/components/ui/jelly-star';
import { INK, PAPER, STAR } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { RADIUS, SPACE } from '@/constants/layout';
import { TYPE } from '@/constants/typography';
import type { GameNode } from '@/features/commentary/api/types';
import Text from '@/features/commentary/components/app-text';
import { CATEGORY_COLOR, parseMarked } from '@/features/commentary/utils/game-logic';

type Props = {
  from: GameNode;
  to: GameNode;
  description: string;
  onNext: () => void;
  // 'close': 3단계에서 선을 눌러 다시 볼 때 — 버튼이 "닫기"가 되고 바깥 · 뒤로 가기로도 닫혀요
  action?: 'next' | 'close';
};

const PANEL_W = 520;
const PANEL_TOP = 58;
// 해설은 서버가 만든 문장이라 길이를 알 수 없어요. 캔버스(402) 안에 들어오도록 본문만 스크롤돼요.
const BODY_MAX_H = 150;
const SCRIM = 'rgba(5,6,18,0.62)';

// 관계 해설 (디자인 c2-explain): 종이 카드에 "A → B" + 서버가 준 관계 설명
export default function ExplainModal({ from, to, description, onNext, action = 'next' }: Props) {
  return (
    <CenterModal
      visible
      top={PANEL_TOP}
      scrimColor={SCRIM}
      onRequestClose={action === 'close' ? onNext : undefined}
      panelStyle={styles.panel}
    >
      <GlassIconButton icon="x" size={32} label="닫기" onPress={onNext} style={styles.close} />
      <View style={styles.paper} accessible accessibilityLabel={`${from.word}에서 ${to.word}으로`}>
        <JellyStar color={CATEGORY_COLOR[from.category]} size={26} />
        <Text style={styles.paperText}>{from.word}</Text>
        <Icon name="arrowRight" color={STAR.mint.c500} scale={1.3} />
        <Text style={styles.paperText}>{to.word}</Text>
        <JellyStar color={CATEGORY_COLOR[to.category]} size={26} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={[TYPE.bodyL, styles.body]}>
          {parseMarked(description).map((seg, i) => (
            <Text key={i} style={seg.mark ? styles.mark : undefined}>
              {seg.text}
            </Text>
          ))}
        </Text>
      </ScrollView>
      <JellyButton
        label={action === 'close' ? '닫기' : '다음'}
        tone="yellow"
        width={150}
        icon={action === 'next' ? <Icon name="chevronRight" color={STAR.yellow.on} /> : undefined}
        iconAfter
        onPress={onNext}
      />
    </CenterModal>
  );
}

const styles = StyleSheet.create({
  panel: { width: PANEL_W, padding: SPACE[6], alignItems: 'center', gap: SPACE[4] },
  close: { position: 'absolute', left: PANEL_W - 44, top: SPACE[4] },
  paper: {
    maxWidth: 470,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACE[3],
    paddingVertical: SPACE[2],
    paddingHorizontal: SPACE[5],
    borderRadius: RADIUS.pill,
    backgroundColor: PAPER.fill,
    borderBottomWidth: 4,
    borderBottomColor: PAPER.edge,
  },
  paperText: { fontFamily: FONT.hand, fontSize: 31, lineHeight: 36, color: PAPER.ink },
  scroll: { maxHeight: BODY_MAX_H, flexGrow: 0 },
  scrollContent: { alignItems: 'center' },
  body: { maxWidth: 330, color: INK[1], textAlign: 'center' },
  mark: {
    color: STAR.yellow.rim,
    textShadowColor: 'rgba(245,158,11,0.8)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 1 },
  },
});
