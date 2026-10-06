import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import type { Category, GameNode } from '@/features/commentary/api/types';
import Baskets from '@/features/commentary/components/baskets';
import CenterModal from '@/features/commentary/components/center-modal';
import FloatStar from '@/features/commentary/components/float-star';
import Icon from '@/features/commentary/components/icon';
import JellyButton from '@/features/commentary/components/jelly-button';
import NodeTray from '@/features/commentary/components/node-tray';
import StarNode from '@/features/commentary/components/star-node';
import StepHeader from '@/features/commentary/components/step-header';
import type { TrayDrag } from '@/features/commentary/components/tray-item';
import WrongToast from '@/features/commentary/components/wrong-toast';
import {
  basketX,
  BASKET_W,
  CLASSIFY_AREA,
  type Point,
  TRAY_STAR,
} from '@/features/commentary/constants/layout';
import { STAR } from '@/features/commentary/constants/theme';
import { TYPE } from '@/features/commentary/constants/typography';
import { useClassifyNode } from '@/features/commentary/hooks/use-game-api';
import { wobble } from '@/features/commentary/hooks/use-motion';
import { useStage } from '@/features/commentary/hooks/use-stage';
import { basketAt, CATEGORY_COLOR, slotCenter } from '@/features/commentary/utils/game-logic';

type Props = {
  sessionId: string;
  nodes: GameNode[];
  categories: Category[];
  onComplete: (order: number[]) => void;
};

type Floating = Point & { id: number };
type Toast = { title?: string; sub?: string } | null;

// 1단계 · 분류하기: 트레이의 별을 끌어 알맞은 바구니에 놓아요. 정답은 드롭할 때마다 서버(/classify)가 판정해요.
export default function ClassifyStep({ sessionId, nodes, categories, onComplete }: Props) {
  const stage = useStage();
  const classify = useClassifyNode(sessionId);
  const [placed, setPlaced] = useState<number[]>([]);
  const [drag, setDrag] = useState<Floating | null>(null);
  const [wrong, setWrong] = useState<Floating | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const wob = useState(() => new Animated.Value(0))[0];
  const dragRef = useRef<Floating | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    stage.measure();
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, [stage]);

  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
  const showToast = (t: NonNullable<Toast>) => {
    setToast(t);
    later(() => setToast(null), 1500);
  };

  const tray = useMemo(() => nodes.filter((n) => !placed.includes(n.id)), [nodes, placed]);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const drop = async (id: number, basketIndex: number, pt: Point) => {
    try {
      const res = await classify.mutateAsync({ nodeId: id, category: categories[basketIndex] });
      if (res.correct) {
        setPlaced((p) => [...p, id]);
        if (res.stageComplete) later(() => setDone(true), 450);
        return;
      }
      setWrong({ id, ...pt });
      showToast({});
      wobble(wob, () => setWrong(null));
    } catch {
      // 연결이 끊겨도 별은 트레이로 돌아가고, 다시 놓아볼 수 있어요.
      showToast({ title: '앗!', sub: '잠시 후 다시 놓아볼까요?' });
    }
  };

  const setDragNow = (d: Floating | null) => {
    dragRef.current = d;
    setDrag(d);
  };
  const trayDrag: TrayDrag = {
    start: (id, px, py) => {
      stage.measure();
      setSelected(null);
      setDragNow({ id, ...stage.toDesign(px, py) });
    },
    move: (px, py) => {
      const d = dragRef.current;
      if (d) setDragNow({ ...d, ...stage.toDesign(px, py) });
    },
    end: (px, py) => {
      const d = dragRef.current;
      setDragNow(null);
      if (!d) return;
      const pt = stage.toDesign(px, py);
      const i = basketAt(pt, categories.length, CLASSIFY_AREA);
      if (i >= 0) drop(d.id, i, pt); // 바구니 밖에 놓으면 벌 없이 트레이로 돌아가요
    },
    cancel: () => setDragNow(null),
  };

  // 톡 고르고 → 바구니 톡 (끌기 대신)
  const handleBasketPress = (i: number) => {
    if (selected == null) return;
    const id = selected;
    setSelected(null);
    drop(id, i, { x: basketX(i) + BASKET_W / 2, y: CLASSIFY_AREA.top + CLASSIFY_AREA.h / 2 });
  };

  const hot = drag ? basketAt(drag, categories.length, CLASSIFY_AREA) : -1;
  const dragNode = drag ? byId.get(drag.id) : undefined;
  const wrongNode = wrong ? byId.get(wrong.id) : undefined;

  return (
    <>
      <StepHeader step={1} title="별을 알맞은 곳에 놓아보세요!" />
      <Baskets
        categories={categories}
        area={CLASSIFY_AREA}
        hot={hot}
        armed={selected != null}
        onBasketPress={handleBasketPress}
      />
      {categories.map((cat, i) => {
        const total = nodes.filter((n) => n.category === cat).length;
        const inside = placed.map((id) => byId.get(id)).filter((n) => n?.category === cat);
        return inside.map((n, k) => {
          if (!n) return null;
          const p = slotCenter(i, k, total, CLASSIFY_AREA);
          return (
            <StarNode
              key={n.id}
              color={CATEGORY_COLOR[cat]}
              name={n.word}
              cx={p.x}
              cy={p.y}
              pop
              style={styles.placed}
              accessibilityLabel={`${cat} 바구니의 ${n.word}`}
            />
          );
        });
      })}

      {tray.length > 0 ? (
        <NodeTray
          nodes={tray}
          selectedId={selected}
          draggingId={drag?.id ?? wrong?.id ?? null}
          disabled={classify.isPending}
          drag={trayDrag}
          onSelect={setSelected}
        />
      ) : null}

      {wrong && wrongNode ? (
        <StarNode
          color="grey"
          name={wrongNode.word}
          cx={wrong.x}
          cy={wrong.y}
          style={[
            styles.wrong,
            {
              transform: [
                {
                  rotate: wob.interpolate({ inputRange: [-1, 1], outputRange: ['-6deg', '6deg'] }),
                },
              ],
            },
          ]}
        />
      ) : null}
      {drag && dragNode ? (
        <View pointerEvents="none" style={styles.dragLayer}>
          <StarNode
            color="grey"
            name={dragNode.word}
            cx={drag.x}
            cy={drag.y - 14}
            size={TRAY_STAR + 6}
          />
        </View>
      ) : null}

      <WrongToast visible={toast != null} title={toast?.title} sub={toast?.sub} />

      {done ? (
        <CenterModal width={380} top={76} style={styles.donePanel}>
          <View style={styles.stars}>
            <FloatStar color="mint" size={40} variant="alt" />
            <FloatStar color="yellow" size={70} />
            <FloatStar color="purple" size={40} variant="alt" />
          </View>
          <Text style={[TYPE.title, styles.doneTitle]}>모든 카드를 분류했어요!</Text>
          <JellyButton tone="yellow" minWidth={160} onPress={() => onComplete(placed)}>
            다음 단계로
            <Icon name="right" size={16} color={STAR.yellow.on} />
          </JellyButton>
        </CenterModal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  placed: { zIndex: 2 },
  wrong: { zIndex: 15 },
  dragLayer: { position: 'absolute', left: 0, top: 0, zIndex: 16 },
  donePanel: { padding: 22, alignItems: 'center', gap: 10 },
  stars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  doneTitle: { fontSize: 31, lineHeight: 37, textAlign: 'center' },
});
