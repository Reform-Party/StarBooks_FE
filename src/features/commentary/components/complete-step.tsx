import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import type { Category, GameNode } from '@/features/commentary/api/types';
import CenterModal from '@/features/commentary/components/center-modal';
import EdgeHit from '@/features/commentary/components/edge-hit';
import ExplainModal from '@/features/commentary/components/explain-modal';
import FloatStar from '@/features/commentary/components/float-star';
import GlassIconButton from '@/features/commentary/components/glass-icon-button';
import Icon from '@/features/commentary/components/icon';
import JellyButton from '@/features/commentary/components/jelly-button';
import LinkLines from '@/features/commentary/components/link-lines';
import type { LinkedEdge } from '@/features/commentary/components/link-step';
import StarNode from '@/features/commentary/components/star-node';
import StepHeader from '@/features/commentary/components/step-header';
import WrongToast from '@/features/commentary/components/wrong-toast';
import { LINK_AREA } from '@/features/commentary/constants/layout';
import { STAR } from '@/features/commentary/constants/theme';
import { TYPE } from '@/features/commentary/constants/typography';
import { useGameEdge } from '@/features/commentary/hooks/use-game-api';
import { CATEGORY_COLOR, nodePositions } from '@/features/commentary/utils/game-logic';

type Props = {
  nodes: GameNode[];
  categories: Category[];
  order: number[];
  edges: LinkedEdge[];
  onHome: () => void;
};

const PANEL_W = 380;

// 3단계 · 별자리 완성 (디자인 c3). 완성 패널을 닫으면 선을 눌러 관계 설명(/edge)을 다시 볼 수 있어요.
export default function CompleteStep({ nodes, categories, order, edges, onHome }: Props) {
  const pos = useMemo(
    () => nodePositions(nodes, categories, order, LINK_AREA),
    [nodes, categories, order],
  );
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const [panelOpen, setPanelOpen] = useState(true);
  const [open, setOpen] = useState<LinkedEdge | null>(null);
  const edge = useGameEdge(open?.edgeId ?? null);

  const drawn = edges.filter((e) => pos[e.from] && pos[e.to]);
  const segments = drawn.map((e): [(typeof pos)[number], (typeof pos)[number]] => [
    pos[e.from],
    pos[e.to],
  ]);

  const handleEdgePress = (e: LinkedEdge) => {
    // 같은 선을 다시 눌렀는데 지난번에 실패했다면 다시 불러와요
    if (open?.edgeId === e.edgeId && edge.isError) edge.refetch();
    else setOpen(e);
  };

  const from = open ? byId.get(open.from) : undefined;
  const to = open ? byId.get(open.to) : undefined;

  return (
    <>
      <StepHeader step={3} title="이야기 별자리를 완성했어요!" />
      <LinkLines segments={segments} />
      {panelOpen
        ? null
        : drawn.map((e) => {
            const a = byId.get(e.from);
            const b = byId.get(e.to);
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
            style={styles.node}
          />
        ) : null,
      )}
      <WrongToast
        visible={open != null && edge.isError}
        title="앗!"
        sub="잠시 후 다시 눌러볼까요?"
      />

      {panelOpen ? (
        <CenterModal width={PANEL_W} top={70} scrimOpacity={0.45} style={styles.panel}>
          <GlassIconButton
            icon="x"
            size={32}
            label="닫고 별자리 보기"
            onPress={() => setPanelOpen(false)}
            style={styles.close}
          />
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
      ) : null}
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
  node: { zIndex: 3 },
  panel: { padding: 20, alignItems: 'center', gap: 10 },
  close: { position: 'absolute', left: PANEL_W - 44, top: 12 },
  message: { lineHeight: 35 },
  mint: { color: STAR.mint.ink },
});
