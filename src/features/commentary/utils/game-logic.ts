// 관계도 게임 화면 규칙. 정답 판정은 서버가 하고, 여기서는 배치 · 좌표 계산만 해요.
import type { Category, GameNode } from '@/features/commentary/api/types';
import { type Area, BASKET_W, basketX, type Point } from '@/features/commentary/constants/layout';
import type { StarColor } from '@/features/commentary/constants/theme';

export const CATEGORY_COLOR: Record<Category, StarColor> = {
  등장인물: 'mint',
  장소: 'purple',
  사건: 'pink',
  교훈: 'yellow',
};

export const pairKey = (a: number, b: number) => (a < b ? `${a}|${b}` : `${b}|${a}`);

// 바구니 안 기본 자리. 디자인 SCATTER 를 그대로 쓰고(1–3개), 4개 이상이면 지그재그로 계산해요.
// n 은 "그 바구니에 들어갈 별의 총 개수" — 별이 하나씩 들어와도 앞서 놓인 별이 움직이지 않아요.
const SCATTER: Record<number, [number, number][][]> = {
  1: [[[0.5, 0.35]]],
  2: [
    [
      [0.66, 0.12],
      [0.32, 0.78],
    ],
    [
      [0.34, 0.2],
      [0.68, 0.85],
    ],
  ],
  3: [
    [
      [0.28, 0.1],
      [0.72, 0.46],
      [0.34, 0.92],
    ],
    [
      [0.7, 0.05],
      [0.3, 0.56],
      [0.66, 0.95],
    ],
  ],
};

// 바구니 안 별 자리는 비율(fx, fy: 0~1)로 기억해요. 1단계(낮은 영역)와 2단계(높은 영역)에서
// 같은 비율로 다시 계산하면 손으로 놓은 배치가 그대로 이어져요. (디자인: 비율 좌표 저장)
export type Spot = { basket: number; fx: number; fy: number };
export type Placement = Record<number, Spot>;

const INSET = { left: 18, w: 144, top: 28, bottom: 72 };
const clamp01 = (v: number) => {
  'worklet';
  return Math.min(1, Math.max(0, v));
};

export function spotToPoint({ basket, fx, fy }: Spot, area: Area): Point {
  'worklet';
  return {
    x: basketX(basket) + INSET.left + fx * INSET.w,
    y: area.top + INSET.top + fy * (area.h - INSET.top - INSET.bottom),
  };
}

export function pointToSpot(pt: Point, basket: number, area: Area): Spot {
  'worklet';
  return {
    basket,
    fx: clamp01((pt.x - basketX(basket) - INSET.left) / INSET.w),
    fy: clamp01((pt.y - area.top - INSET.top) / (area.h - INSET.top - INSET.bottom)),
  };
}

// 길게 눌러 옮길 때 같은 바구니 밖으로 못 나가게 해요.
export function clampToBasket(pt: Point, basket: number, area: Area): Point {
  'worklet';
  return spotToPoint(pointToSpot(pt, basket, area), area);
}

// 손으로 놓지 않은 별(톡 · 톡으로 넣기, 이미 끝낸 게임)의 기본 자리
export function defaultSpot(basket: number, k: number, n: number): Spot {
  const pats = SCATTER[n];
  if (pats) {
    // 디자인: 바구니 1·2 → 첫 패턴, 3·4 → 둘째 패턴
    const [fx, fy] = pats[Math.floor(basket / 2) % pats.length][k];
    return { basket, fx, fy };
  }
  const cols = n <= 4 ? 2 : 3;
  const xs = cols === 2 ? [0.3, 0.7] : [0.16, 0.5, 0.84];
  // 살짝 흔들어 손으로 놓은 느낌
  return {
    basket,
    fx: xs[k % cols] + (((k * 37) % 7) - 3) * 0.01,
    fy: 0.06 + (0.88 * k) / (n - 1),
  };
}

export function basketAt(pt: Point, count: number, area: Area, pad = 10) {
  'worklet';
  for (let i = 0; i < count; i++) {
    const x = basketX(i);
    if (
      pt.x >= x - pad &&
      pt.x <= x + BASKET_W + pad &&
      pt.y >= area.top - pad &&
      pt.y <= area.top + area.h + pad
    )
      return i;
  }
  return -1;
}

// 저장한 비율 자리가 있으면 그대로, 없으면 기본 자리로 별 위치를 정해요.
export function nodePositions(
  nodes: GameNode[],
  categories: Category[],
  placement: Placement,
  area: Area,
): Record<number, Point> {
  const pos: Record<number, Point> = {};
  categories.forEach((cat, basket) => {
    const inside = nodes.filter((n) => n.category === cat);
    inside.forEach((n, k) => {
      pos[n.id] = spotToPoint(placement[n.id] ?? defaultSpot(basket, k, inside.length), area);
    });
  });
  return pos;
}

// "용왕님은 {{토끼의 간}}을" → 강조 구간을 나눠요 (서버 설명에 {{ }} 가 있을 때만)
export function parseMarked(text: string) {
  const out: { text: string; mark?: boolean }[] = [];
  const re = /\{\{(.+?)\}\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    out.push({ text: m[1], mark: true });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

export const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
