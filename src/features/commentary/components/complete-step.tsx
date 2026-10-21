import { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';

import type { Category, GameNode } from '@/features/commentary/api/types';
import Text from '@/features/commentary/components/app-text';
import CenterModal from '@/features/commentary/components/center-modal';
import EdgeHit from '@/features/commentary/components/edge-hit';
import ExplainModal from '@/features/commentary/components/explain-modal';
import FloatStar from '@/features/commentary/components/float-star';
import Icon from '@/features/commentary/components/icon';
import JellyButton from '@/features/commentary/components/jelly-button';
import LinkLines from '@/features/commentary/components/link-lines';
import type { LinkedEdge } from '@/features/commentary/components/link-step';
import StarNode from '@/features/commentary/components/star-node';
import StepHeader from '@/features/commentary/components/step-header';
import WrongToast from '@/features/commentary/components/wrong-toast';
import { LINK_AREA } from '@/features/commentary/constants/layout';
import { SPACE, STAR } from '@/features/commentary/constants/theme';
import { TYPE } from '@/features/commentary/constants/typography';
import { useGameEdge } from '@/features/commentary/hooks/use-game-api';
import {
  CATEGORY_COLOR,
  nodePositions,
  pairKey,
  type Placement,
} from '@/features/commentary/utils/game-logic';
import { haptic } from '@/features/commentary/utils/haptics';

type Props = {
  nodes: GameNode[];
  categories: Category[];
  placement: Placement;
  edges: LinkedEdge[];
  onHome: () => void;
};

// 3단계 · 별자리 완성 (디자인 c3). 완성 패널이 떠 있어도 뒤의 선을 눌러 관계 설명(/edge)을 볼 수 있고,
// 별을 누르면 햅틱과 함께 한 바퀴 돌아요.
export default function CompleteStep({ nodes, categories, placement, edges, onHome }: Props) {
  const pos = useMemo(
    () => nodePositions(nodes, categories, placement, LINK_AREA),
    [nodes, categories, placement],
  );
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const [open, setOpen] = useState<LinkedEdge | null>(null);
  const edge = useGameEdge(open?.edgeId ?? null);

  const drawn = edges.filter((e) => pos[e.from] && pos[e.to]);

  const handleEdgePress = (e: LinkedEdge) => {
    haptic('tap');
    // 같은 선을 다시 눌렀는데 지난번에 실패했다면 다시 불러와요
    if (open?.edgeId === e.edgeId && edge.isError) edge.refetch();
    else setOpen(e);
  };

  const from = open ? byId.get(open.from) : undefined;
  const to = open ? byId.get(open.to) : undefined;

  return (
    <>
      <StepHeader step={3} title="이야기 별자리를 완성했어요!" />
      <LinkLines
        segments={drawn.map((e) => ({ key: pairKey(e.from, e.to), a: pos[e.from], b: pos[e.to] }))}
      />
      {drawn.map((e) => {
        const a = byId.get(e.from);
        const b = byId.get(e.to);
        // edgeId 가 없는 선은 설명을 부를 수 없어서 누를 자리를 만들지 않아요
        return e.edgeId != null && a && b ? (
          <EdgeHit
            key={e.edgeId}
            from={pos[e.from]}
            to={pos[e.to]}
            label={`${a.word}, ${b.word} 관계 보기`}
            onPress={() => handleEdgePress(e)}
          />
        ) : null;
      })}
      {nodes.map((n) =>
        pos[n.id] ? (
          <StarNode
            key={n.id}
            color={CATEGORY_COLOR[n.category]}
            name={n.word}
            cx={pos[n.id].x}
            cy={pos[n.id].y}
            onPress={() => haptic('tap')}
            style={styles.node}
          />
        ) : null,
      )}
      <WrongToast
        visible={open != null && edge.isError}
        title="앗!"
        sub="잠시 후 다시 눌러볼까요?"
        raised
      />

      <CenterModal width={380} top={70} scrimOpacity={0.45} passThrough style={styles.panel}>
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
      {open && edge.data && from && to ? (
        <ExplainModal
          from={from}
          to={to}
          description={edge.data.description}
          action="close"
          onNext={() => setOpen(null)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  // 완성 패널의 막은 터치를 통과시켜서(passThrough) 막 아래의 별 · 선도 눌러져요
  node: { zIndex: 3 },
  panel: { padding: SPACE.xl, alignItems: 'center', gap: SPACE.m },
  message: { lineHeight: 35 },
  mint: { color: STAR.mint.ink },
});
