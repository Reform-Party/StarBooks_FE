import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import CenterModal from '@/components/ui/center-modal';
import Icon from '@/components/ui/icon';
import JellyButton from '@/components/ui/jelly-button';
import { INK, STAR } from '@/constants/colors';
import { SPACE } from '@/constants/layout';
import { TYPE } from '@/constants/typography';
import type { Category, GameNode, GraphEdge } from '@/features/commentary/api/types';
import Text from '@/features/commentary/components/app-text';
import ConstellationTap from '@/features/commentary/components/constellation-tap';
import EdgeHit from '@/features/commentary/components/edge-hit';
import ExplainModal from '@/features/commentary/components/explain-modal';
import FloatStar from '@/features/commentary/components/float-star';
import LinkLines from '@/features/commentary/components/link-lines';
import StarNode from '@/features/commentary/components/star-node';
import StepHeader from '@/features/commentary/components/step-header';
import WrongToast from '@/features/commentary/components/wrong-toast';
import { LINK_AREA } from '@/features/commentary/constants/board';
import { useBanner } from '@/features/commentary/hooks/use-banner';
import { edgeQueryOptions, useCachedEdge } from '@/features/commentary/hooks/use-game-api';
import {
  CATEGORY_COLOR,
  nodePositions,
  pairKey,
  type Placement,
} from '@/features/commentary/utils/game-logic';
import { haptic } from '@/features/commentary/utils/haptics';
import { ApiError } from '@/lib/api-client';

// 디자인 c3: 완성 패널 뒤로 별자리가 비쳐 보여요
const SCRIM = 'rgba(5,6,18,0.45)';

type Props = {
  nodes: GameNode[];
  categories: Category[];
  placement: Placement;
  edges: GraphEdge[];
  onHome: () => void;
};

// 3단계 · 별자리 완성 (디자인 c3). 완성 패널이 떠 있어도 뒤의 선을 눌러 관계 설명(/edge)을 볼 수 있고,
// 별을 누르면 햅틱과 함께 한 바퀴 돌아요.
export default function CompleteStep({ nodes, categories, placement, edges, onHome }: Props) {
  const queryClient = useQueryClient();
  const pos = useMemo(
    () => nodePositions(nodes, categories, placement, LINK_AREA),
    [nodes, categories, placement],
  );
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const [open, setOpen] = useState<GraphEdge | null>(null);
  const [spins, setSpins] = useState<Record<number, number>>({});
  const edge = useCachedEdge(open?.edgeId ?? null);
  const banner = useBanner();
  // 가장 최근에 누른 선. 늦게 온 실패가 다른 선의 해설을 닫지 않게 해요.
  const lastPressed = useRef<number | null>(null);

  // edgeId 가 없는 선은 설명을 부를 수 없어서 누를 수 없어요
  const drawn = edges.filter((e) => pos[e.from] && pos[e.to]);
  const pressable = drawn.filter((e) => e.edgeId != null);

  const handleStar = (id: number) => {
    haptic('tap');
    setSpins((s) => ({ ...s, [id]: (s[id] ?? 0) + 1 }));
  };

  // 누르자마자 해설을 열고(설명은 로딩), 실패하면 닫은 뒤 다른 단계처럼 1.8초 배너로 알려요.
  const handleLine = async (e: GraphEdge) => {
    if (e.edgeId == null) return;
    const edgeId = e.edgeId;
    haptic('tap');
    lastPressed.current = edgeId;
    setOpen(e);
    try {
      await queryClient.fetchQuery(edgeQueryOptions(edgeId));
    } catch (err) {
      if (lastPressed.current !== edgeId) return;
      setOpen(null);
      const missing = err instanceof ApiError && err.status >= 400 && err.status < 500;
      banner.show({
        title: '앗!',
        // 다시 눌러도 같은 경우(4xx)엔 다시 누르라고 하지 않아요
        sub: missing ? '이 관계 설명은 지금 볼 수 없어요.' : '잠시 후 다시 눌러볼까요?',
      });
    }
  };

  const from = open ? byId.get(open.from) : undefined;
  const to = open ? byId.get(open.to) : undefined;

  return (
    <>
      <StepHeader step={3} title="이야기 별자리를 완성했어요!" />
      <LinkLines
        segments={drawn.map((e) => ({ key: pairKey(e.from, e.to), a: pos[e.from], b: pos[e.to] }))}
      />
      {pressable.map((e) => {
        const a = byId.get(e.from);
        const b = byId.get(e.to);
        return a && b ? (
          <EdgeHit
            key={e.edgeId}
            from={pos[e.from]}
            to={pos[e.to]}
            label={`${a.word}, ${b.word} 관계 보기`}
            onPress={() => handleLine(e)}
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
            spin={spins[n.id]}
            onActivate={() => handleStar(n.id)}
            style={styles.node}
          />
        ) : null,
      )}
      <ConstellationTap
        stars={nodes.filter((n) => pos[n.id]).map((n) => ({ id: n.id, at: pos[n.id] }))}
        lines={pressable.map((e) => ({ edge: e, a: pos[e.from], b: pos[e.to] }))}
        onStar={handleStar}
        onLine={handleLine}
      />
      {/* 완성 패널의 "메인으로" 버튼을 가리지 않게 위쪽에 띄워요 */}
      <WrongToast
        visible={banner.visible}
        title={banner.banner.title}
        sub={banner.banner.sub}
        raised
      />

      <CenterModal visible top={70} scrimColor={SCRIM} passThrough panelStyle={styles.panel}>
        <FloatStar color="yellow" size={64} />
        <Text style={[TYPE.heading, styles.message]}>
          <Text style={styles.mint}>동화 여행</Text>
          {'에서\n동화책을 다시 볼 수 있어요!'}
        </Text>
        <JellyButton
          label="메인으로"
          tone="yellow"
          width={150}
          icon={<Icon name="home" color={STAR.yellow.on} />}
          onPress={onHome}
        />
      </CenterModal>
      {open && from && to ? (
        <ExplainModal
          from={from}
          to={to}
          description={edge.data?.description ?? ''}
          loading={!edge.data}
          action="close"
          onNext={() => {
            lastPressed.current = null;
            setOpen(null);
          }}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  // 완성 패널의 막은 터치를 통과시켜서(passThrough) 막 아래의 별 · 선도 눌러져요
  node: { zIndex: 3 },
  panel: { width: 380, padding: SPACE[6], alignItems: 'center', gap: SPACE[4] },
  message: { lineHeight: 35, color: INK[1], textAlign: 'center' },
  mint: { color: STAR.mint.rim },
});
