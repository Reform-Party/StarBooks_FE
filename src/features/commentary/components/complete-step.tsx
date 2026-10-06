import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import type { Category, GameNode } from '@/features/commentary/api/types';
import CenterModal from '@/features/commentary/components/center-modal';
import FloatStar from '@/features/commentary/components/float-star';
import Icon from '@/features/commentary/components/icon';
import JellyButton from '@/features/commentary/components/jelly-button';
import LinkLines from '@/features/commentary/components/link-lines';
import type { Pair } from '@/features/commentary/components/link-step';
import StarNode from '@/features/commentary/components/star-node';
import StepHeader from '@/features/commentary/components/step-header';
import { LINK_AREA } from '@/features/commentary/constants/layout';
import { STAR } from '@/features/commentary/constants/theme';
import { TYPE } from '@/features/commentary/constants/typography';
import { CATEGORY_COLOR, nodePositions } from '@/features/commentary/utils/game-logic';

type Props = {
  nodes: GameNode[];
  categories: Category[];
  order: number[];
  edges: Pair[];
  onHome: () => void;
};

// 3단계 · 별자리 완성 (디자인 c3)
export default function CompleteStep({ nodes, categories, order, edges, onHome }: Props) {
  const pos = useMemo(
    () => nodePositions(nodes, categories, order, LINK_AREA),
    [nodes, categories, order],
  );
  const segments = edges
    .filter((e) => pos[e.from] && pos[e.to])
    .map((e): [(typeof pos)[number], (typeof pos)[number]] => [pos[e.from], pos[e.to]]);
  return (
    <>
      <StepHeader step={3} title="이야기 별자리를 완성했어요!" />
      <LinkLines segments={segments} />
      {nodes.map((n) =>
        pos[n.id] ? (
          <StarNode
            key={n.id}
            color={CATEGORY_COLOR[n.category]}
            name={n.word}
            cx={pos[n.id].x}
            cy={pos[n.id].y}
            style={styles.node}
          />
        ) : null,
      )}
      <CenterModal width={380} top={70} scrimOpacity={0.45} style={styles.panel}>
        <FloatStar color="yellow" size={64} />
        <Text style={[TYPE.h2, styles.message]}>
          <Text style={styles.mint}>동화 여행</Text>
          {'에서\n동화책을 다시 볼 수 있어요!'}
        </Text>
        <JellyButton tone="yellow" minWidth={150} onPress={onHome}>
          <Icon name="home" size={16} color={STAR.yellow.on} />
          메인으로
        </JellyButton>
      </CenterModal>
    </>
  );
}

const styles = StyleSheet.create({
  node: { zIndex: 3 },
  panel: { padding: 20, alignItems: 'center', gap: 10 },
  message: { lineHeight: 35 },
  mint: { color: STAR.mint.ink },
});
