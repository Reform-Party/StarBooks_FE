import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { isSessionExpired } from '@/features/commentary/api/game-api';
import type { Category, GameNode } from '@/features/commentary/api/types';
import Text from '@/features/commentary/components/app-text';
import Baskets from '@/features/commentary/components/baskets';
import CenterModal from '@/components/ui/center-modal';
import FloatStar from '@/features/commentary/components/float-star';
import GestureStar from '@/features/commentary/components/gesture-star';
import Icon from '@/components/ui/icon';
import JellyButton from '@/components/ui/jelly-button';
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
  TRAY,
  TRAY_STAR,
} from '@/features/commentary/constants/board';
import { MOTION } from '@/features/commentary/constants/motion';
import { SPACE } from '@/constants/layout';
import { INK, STAR } from '@/constants/colors';
import { TYPE } from '@/constants/typography';
import { useBanner } from '@/features/commentary/hooks/use-banner';
import { useClassifyNode } from '@/features/commentary/hooks/use-game-api';
import { useScreenShake } from '@/features/commentary/hooks/use-motion';
import { useCanvas } from '@/features/commentary/hooks/use-canvas';
import {
  basketAt,
  CATEGORY_COLOR,
  defaultSpot,
  type Placement,
  pointToSpot,
  spotToPoint,
} from '@/features/commentary/utils/game-logic';

export type ClassifyResult = {
  placement: Placement;
  // 1단계 완료 응답이 준 2단계 노드 (없으면 /start 의 노드를 그대로 써요)
  nextNodes?: GameNode[];
};

type Props = {
  sessionId: string;
  nodes: GameNode[];
  categories: Category[];
  onComplete: (result: ClassifyResult) => void;
  onSessionExpired: () => void;
};

// 틀린 별: 놓은 자리(from)에서 붉게 흔들린 뒤 목록 자리(to)로 돌아가요.
type Wrong = { id: number; from: Point; to: Point };
// 서버 판정을 기다리는 별: 놓은 자리에 흐리게 붙잡아 둬요
type Judging = { id: number; at: Point };

// 분류 끝 패널 뒤로 바구니가 비쳐 보이게 (디자인 c1-done)
const SCRIM = 'rgba(5,6,18,0.62)';

const TRAY_HOME: Point = { x: TRAY.left + TRAY.w / 2, y: TRAY.top + TRAY.h / 2 };

// 1단계 · 분류하기: 트레이의 별을 끌어 알맞은 바구니에 놓아요. 정답은 드롭할 때마다 서버(/classify)가 판정해요.
export default function ClassifyStep({
  sessionId,
  nodes,
  categories,
  onComplete,
  onSessionExpired,
}: Props) {
  const stage = useCanvas();
  const classify = useClassifyNode(sessionId);
  const shake = useScreenShake();
  const [placement, setPlacement] = useState<Placement>({});
  const [dragId, setDragId] = useState<number | null>(null);
  const [hot, setHot] = useState(-1);
  const [wrong, setWrong] = useState<Wrong | null>(null);
  const [judging, setJudging] = useState<Judging | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [nextNodes, setNextNodes] = useState<GameNode[] | undefined>();
  const [done, setDone] = useState(false);
  const tint = useState(() => new Animated.Value(0))[0];
  const back = useState(() => new Animated.Value(0))[0];
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragHot = useSharedValue(-1);
  // 지금 끌고 있는 트레이 별 (-1: 없음). 두 손가락으로 두 별을 동시에 끌지 못하게 해요.
  const dragOwner = useSharedValue(-1);
  // 판정 요청이 진행 중이면 다음 놓기(끌기 · 톡 · 톡)를 막아요. 렌더를 기다리지 않게 ref 로 둬요.
  const busy = useRef(false);
  const banner = useBanner();
  const origin = useRef<Point>(TRAY_HOME);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    stage.measure();
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, [stage]);

  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  const placed = useMemo(() => new Set(Object.keys(placement).map(Number)), [placement]);
  const tray = useMemo(() => nodes.filter((n) => !placed.has(n.id)), [nodes, placed]);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // 오답: 붉은 틴트 0.15s + 화면 흔들림 0.3s → 목록으로 복귀 스프링 0.3s
  const playWrong = (w: Wrong) => {
    setWrong(w);
    tint.setValue(0);
    back.setValue(0);
    shake.run();
    const half = MOTION.tint / 2;
    Animated.sequence([
      Animated.timing(tint, { toValue: 1, duration: half, useNativeDriver: true }),
      Animated.timing(tint, { toValue: 0, duration: half, useNativeDriver: true }),
      Animated.delay(MOTION.shake - MOTION.tint),
      Animated.timing(back, {
        toValue: 1,
        duration: MOTION.back,
        easing: MOTION.springEase,
        useNativeDriver: true,
      }),
    ]).start(() => setWrong(null));
  };

  const drop = async (id: number, basket: number, at: Point | null) => {
    if (busy.current) return;
    busy.current = true;
    setJudging({
      id,
      at: at ?? { x: basketX(basket) + BASKET_W / 2, y: CLASSIFY_AREA.top + 60 },
    });
    try {
      const res = await classify.mutateAsync({ nodeId: id, category: categories[basket] });
      if (res.correct) {
        const cat = categories[basket];
        const k = nodes.filter((n) => n.category === cat && placed.has(n.id)).length;
        const total = nodes.filter((n) => n.category === cat).length;
        // 놓은 자리를 그 바구니 안 비율로 기억해요. 톡 · 톡으로 넣었으면 기본 자리.
        const spot = at ? pointToSpot(at, basket, CLASSIFY_AREA) : defaultSpot(basket, k, total);
        setPlacement((p) => ({ ...p, [id]: spot }));
        if (res.stageComplete) {
          setNextNodes(res.question?.nodes);
          later(() => setDone(true), 450);
        }
        return;
      }
      playWrong({
        id,
        from: at ?? { x: basketX(basket) + BASKET_W / 2, y: CLASSIFY_AREA.top + 60 },
        to: origin.current,
      });
      banner.show({});
    } catch (e) {
      if (isSessionExpired(e)) return onSessionExpired();
      // 연결이 끊겨도 별은 트레이로 돌아가고, 다시 놓아볼 수 있어요.
      banner.show({ title: '앗!', sub: '잠시 후 다시 놓아볼까요?' });
    } finally {
      busy.current = false;
      setJudging(null);
    }
  };

  const trayDrag: TrayDrag = {
    frame: stage.frame,
    x: dragX,
    y: dragY,
    hot: dragHot,
    owner: dragOwner,
    area: CLASSIFY_AREA,
    basketCount: categories.length,
    onStart: (id, x, y) => {
      setSelected(null);
      origin.current = { x, y };
      setDragId(id);
    },
    onHot: setHot,
    onDrop: (id, x, y) => {
      setDragId(null);
      setHot(-1);
      const basket = basketAt({ x, y }, categories.length, CLASSIFY_AREA);
      // 바구니 밖에 놓으면 벌 없이 트레이로 돌아가요
      if (basket >= 0) drop(id, basket, { x, y });
    },
    onCancel: () => {
      setDragId(null);
      setHot(-1);
    },
  };

  // 톡 고르고 → 바구니 톡 (끌기 대신)
  const handleBasketPress = (i: number) => {
    if (selected == null) return;
    const id = selected;
    setSelected(null);
    origin.current = TRAY_HOME;
    drop(id, i, null);
  };

  const handleMoved = (id: number, at: Point) =>
    setPlacement((p) => {
      const spot = p[id];
      return spot ? { ...p, [id]: pointToSpot(at, spot.basket, CLASSIFY_AREA) } : p;
    });

  const floating = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.value }, { translateY: dragY.value - 14 }],
  }));

  const dragNode = dragId != null ? byId.get(dragId) : undefined;
  const wrongNode = wrong ? byId.get(wrong.id) : undefined;
  const judgingNode = judging ? byId.get(judging.id) : undefined;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, shake.style]} pointerEvents="box-none">
      <StepHeader step={1} title="별을 알맞은 곳에 놓아보세요!" />
      <Baskets
        categories={categories}
        area={CLASSIFY_AREA}
        hot={hot}
        armed={selected != null}
        onBasketPress={handleBasketPress}
      />
      {Object.entries(placement).map(([key, spot]) => {
        const n = byId.get(Number(key));
        if (!n) return null;
        const p = spotToPoint(spot, CLASSIFY_AREA);
        return (
          <GestureStar
            key={n.id}
            node={n}
            basket={spot.basket}
            area={CLASSIFY_AREA}
            cx={p.x}
            cy={p.y}
            pop
            accessibilityLabel={`${n.category} 바구니의 ${n.word}`}
            onMoved={handleMoved}
          />
        );
      })}

      <NodeTray
        nodes={tray}
        selectedId={selected}
        draggingId={dragId ?? judging?.id ?? wrong?.id ?? null}
        disabled={classify.isPending}
        drag={trayDrag}
        onSelect={setSelected}
      />

      {wrong && wrongNode ? (
        <StarNode
          color={CATEGORY_COLOR[wrongNode.category]}
          name={wrongNode.word}
          cx={wrong.from.x}
          cy={wrong.from.y}
          tint={tint}
          style={[
            styles.wrong,
            {
              transform: [
                {
                  translateX: back.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, wrong.to.x - wrong.from.x],
                  }),
                },
                {
                  translateY: back.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, wrong.to.y - wrong.from.y],
                  }),
                },
              ],
            },
          ]}
        />
      ) : null}
      {judging && judgingNode ? (
        // 판정을 기다리는 동안 놓은 자리에 흐리게 (트레이가 왜 멈췄는지도 알려줘요)
        <StarNode
          color={CATEGORY_COLOR[judgingNode.category]}
          name={judgingNode.word}
          cx={judging.at.x}
          cy={judging.at.y}
          accessibilityLabel={`${judgingNode.word}, 확인하는 중`}
          style={styles.judging}
        />
      ) : null}
      {dragNode ? (
        <Reanimated.View pointerEvents="none" style={[styles.dragLayer, floating]}>
          <StarNode
            color={CATEGORY_COLOR[dragNode.category]}
            name={dragNode.word}
            cx={0}
            cy={0}
            size={TRAY_STAR + 6}
          />
        </Reanimated.View>
      ) : null}

      <WrongToast visible={banner.visible} title={banner.banner.title} sub={banner.banner.sub} />

      {done ? (
        <CenterModal visible top={76} scrimColor={SCRIM} panelStyle={styles.donePanel}>
          <View style={styles.stars}>
            <FloatStar color="mint" size={40} variant="alt" />
            <FloatStar color="yellow" size={70} />
            <FloatStar color="purple" size={40} variant="alt" />
          </View>
          <Text style={[TYPE.title, styles.doneTitle]}>모든 카드를 분류했어요!</Text>
          <JellyButton
            label="다음 단계로"
            tone="yellow"
            width={160}
            icon={<Icon name="chevronRight" color={STAR.yellow.on} />}
            iconAfter
            onPress={() => onComplete({ placement, nextNodes })}
          />
        </CenterModal>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrong: { zIndex: 15 },
  judging: { zIndex: 15, opacity: 0.5 },
  dragLayer: { position: 'absolute', left: 0, top: 0, zIndex: 16 },
  donePanel: { width: 380, padding: SPACE[6], alignItems: 'center', gap: SPACE[4] },
  stars: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACE[1] },
  doneTitle: { fontSize: 31, lineHeight: 37, color: INK[1], textAlign: 'center' },
});
