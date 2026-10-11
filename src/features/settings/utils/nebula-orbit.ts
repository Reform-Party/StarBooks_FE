import { NEBULA_PIECES, type NebulaKind } from '@/features/settings/constants/nebula-pieces';

// Figma 컴포넌트 문서 › 성운 (목소리 등록)
// - Axis: 화면에서 −21.6° 기울고 관찰자 쪽으로 26° 숙인 축 하나. 회전 중심은 가운데 빛.
// - Rest pack: 쉬는 자리를 Figma 원본보다 안쪽으로 당겨 한 덩어리로 뭉쳐요.
// - Talk: 조각마다 축이 최대 27° 틀어지고 속도 1.3–2.7배(일부 반대 방향), 궤도 반지름 +clamp(900 ÷ 지름, 4, 60).
// - Live dB: 작은 알갱이는 15ms 로 바로, 큰 구름은 최대 0.27초 늦게 따라와요.
const TILT = (-21.6 * Math.PI) / 180;
const LEAN = (26 * Math.PI) / 180;
const MAX_AXIS_TWIST = (27 * Math.PI) / 180;
const REST_PACK: Record<NebulaKind, number> = {
  spark: 0.64,
  arm: 0.78,
  halo: 0.92,
  ring: 0.92,
  core: 1,
};
// 문서 수치는 지름 248 헤일로 기준이라 196 상자 크기로 줄여서 써요.
const DOC_SCALE = 136.22 / 248;
const LAG_MS = { min: 15, max: 270 };

type Vec3 = [number, number, number];

export type NebulaOrbit = {
  // 조각 SVG 를 놓는 자리(가운데) — 196 상자 기준
  cx: number;
  cy: number;
  // 쉬는 자리에서 축 방향 높이 · 축에서 떨어진 거리 · 처음 각도
  h: number;
  r: number;
  theta: number;
  // 말할 때 틀어진 축 (A: 축, E1 · E2: 궤도 평면)
  talkA: Vec3;
  talkE1: Vec3;
  talkE2: Vec3;
  speed: number; // 말할 때 속도 배율 (음수면 반대 방향)
  spread: number; // 목소리가 가장 클 때 궤도가 벌어지는 거리(pt)
  lag: number; // 목소리를 따라오는 시간(ms)
  meridian: boolean; // 빛띠 · 헤일로 · 고리: 경선처럼 돌며 옆면이 보여요
};

export const NEBULA_TILT = TILT;
export const RIGID_A: Vec3 = [0, -Math.cos(LEAN), Math.sin(LEAN)];
export const RIGID_E1: Vec3 = [1, 0, 0];
export const RIGID_E2: Vec3 = [0, Math.sin(LEAN), Math.cos(LEAN)];

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// 로드리게스 회전: v 를 단위 벡터 k 둘레로 angle 만큼
function rotate(v: Vec3, k: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const kv = dot(k, v);
  const cross: Vec3 = [
    k[1] * v[2] - k[2] * v[1],
    k[2] * v[0] - k[0] * v[2],
    k[0] * v[1] - k[1] * v[0],
  ];
  return [0, 1, 2].map((i) => v[i] * c + cross[i] * s + k[i] * kv * (1 - c)) as Vec3;
}

// 매번 같은 모양이 나오도록 조각 번호로 만든 0–1 난수
function seeded(n: number, salt: number) {
  const x = Math.sin(n * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const core = NEBULA_PIECES.find((p) => p.kind === 'core');
if (!core) throw new Error('성운 데이터에 가운데 빛(core)이 없어요.');

// 회전 중심 (196 상자 기준)
export const NEBULA_CENTER = { x: core.cx, y: core.cy };

function buildOrbits(): NebulaOrbit[] {
  const unitCount = Math.max(...NEBULA_PIECES.map((p) => p.unit)) + 1;
  const units = Array.from({ length: unitCount }, (_, u) => {
    const members = NEBULA_PIECES.filter((p) => p.unit === u);
    return {
      kind: members[0].kind,
      cx: members.reduce((sum, p) => sum + p.cx, 0) / members.length,
      cy: members.reduce((sum, p) => sum + p.cy, 0) / members.length,
      size: Math.max(...members.map((p) => p.size)),
    };
  });

  // 쉬는 자리 → 축이 세로가 되도록 화면 기울기를 되돌린 좌표
  const flat = units.map((unit) => {
    const pack = REST_PACK[unit.kind];
    const dx = (unit.cx - NEBULA_CENTER.x) * pack;
    const dy = (unit.cy - NEBULA_CENTER.y) * pack;
    return [
      dx * Math.cos(-TILT) - dy * Math.sin(-TILT),
      dx * Math.sin(-TILT) + dy * Math.cos(-TILT),
    ];
  });
  // 알갱이는 구 표면에 놓아서, 돌아가는 궤적 전체가 구가 되게 해요.
  const sphere =
    1.15 *
    Math.max(...flat.filter((_, u) => units[u].kind === 'spark').map(([x, y]) => Math.hypot(x, y)));
  const sizes = units.map((u) => u.size);
  const minSize = Math.min(...sizes);
  const maxSize = Math.max(...sizes);

  return units.map((unit, u) => {
    const [x, y] = flat[u];
    const side = u % 2 === 0 ? 1 : -1;
    const z =
      unit.kind === 'spark' ? side * 0.55 * Math.sqrt(Math.max(0, sphere ** 2 - x * x - y * y)) : 0;
    const p: Vec3 = [x, y, z];
    const h = dot(p, RIGID_A);
    const radial: Vec3 = [p[0] - h * RIGID_A[0], p[1] - h * RIGID_A[1], p[2] - h * RIGID_A[2]];

    const twistAround: Vec3 = rotate(RIGID_E1, RIGID_A, seeded(u, 1) * Math.PI * 2);
    const twist = (seeded(u, 2) * 2 - 1) * MAX_AXIS_TWIST;
    const reverse = seeded(u, 4) < 0.3;
    const docSize = unit.size / DOC_SCALE;

    return {
      cx: unit.cx,
      cy: unit.cy,
      h,
      r: Math.hypot(...radial),
      theta: Math.atan2(dot(radial, RIGID_E2), dot(radial, RIGID_E1)),
      talkA: rotate(RIGID_A, twistAround, twist),
      talkE1: rotate(RIGID_E1, twistAround, twist),
      talkE2: rotate(RIGID_E2, twistAround, twist),
      speed: (1.3 + 1.4 * seeded(u, 3)) * (reverse ? -1 : 1),
      spread: unit.kind === 'core' ? 0 : clamp(900 / docSize, 4, 60) * DOC_SCALE,
      lag: LAG_MS.min + (LAG_MS.max - LAG_MS.min) * ((unit.size - minSize) / (maxSize - minSize)),
      meridian: unit.kind === 'halo' || unit.kind === 'arm' || unit.kind === 'ring',
    };
  });
}

export const NEBULA_ORBITS = buildOrbits();

// 깊이를 0–1 로 나눌 때 쓰는 구 반지름
export const NEBULA_DEPTH = Math.max(...NEBULA_ORBITS.map((o) => Math.hypot(o.h, o.r)));
