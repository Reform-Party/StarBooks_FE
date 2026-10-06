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

// 바구니 안 별 자리. 디자인 SCATTER 를 그대로 쓰고(1–3개), 4개 이상이면 지그재그로 계산해요.
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

export function slotCenter(basketIndex: number, k: number, n: number, area: Area): Point {
  let fx: number;
  let fy: number;
  const pats = SCATTER[n];
  if (pats) {
    // 디자인: 바구니 1·2 → 첫 패턴, 3·4 → 둘째 패턴
    [fx, fy] = pats[Math.floor(basketIndex / 2) % pats.length][k];
  } else {
    const cols = n <= 4 ? 2 : 3;
    const xs = cols === 2 ? [0.3, 0.7] : [0.16, 0.5, 0.84];
    fx = xs[k % cols] + (((k * 37) % 7) - 3) * 0.01; // 살짝 흔들어 손으로 놓은 느낌
    fy = 0.06 + (0.88 * k) / (n - 1);
  }
  return {
    x: Math.round(basketX(basketIndex) + 18 + fx * 144),
    y: Math.round(area.top + 28 + fy * (area.h - 100)),
  };
}

export function basketAt(pt: Point, count: number, area: Area, pad = 10) {
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

// 분류한 순서대로 바구니 안 자리를 정해요. 순서를 모르면(이미 끝낸 게임) 노드 순서를 써요.
export function nodePositions(
  nodes: GameNode[],
  categories: Category[],
  order: number[],
  area: Area,
): Record<number, Point> {
  const pos: Record<number, Point> = {};
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const ordered = [...order, ...nodes.map((n) => n.id).filter((id) => !order.includes(id))];
  categories.forEach((cat, i) => {
    const inside = ordered.map((id) => byId.get(id)).filter((n) => n?.category === cat);
    const total = nodes.filter((n) => n.category === cat).length;
    inside.forEach((n, k) => {
      if (n) pos[n.id] = slotCenter(i, k, total, area);
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
