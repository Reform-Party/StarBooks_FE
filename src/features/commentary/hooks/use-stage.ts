import { createContext, useContext } from 'react';
import type { SharedValue } from 'react-native-reanimated';

import type { Point } from '@/features/commentary/constants/layout';

export type StageFrame = { x: number; y: number; scale: number };

type StageApi = {
  // 손가락 위치(pageX, pageY)를 874 × 402 디자인 좌표로 바꿔요.
  toDesign: (pageX: number, pageY: number) => Point;
  measure: () => void;
  // 제스처(UI 스레드)에서 같은 계산을 하려고 화면 위치 · 배율을 공유해요.
  frame: SharedValue<StageFrame>;
};

// 제스처 콜백(worklet)용 toDesign
export function toDesign(frame: StageFrame, absX: number, absY: number): Point {
  'worklet';
  return { x: (absX - frame.x) / frame.scale, y: (absY - frame.y) / frame.scale };
}

export const StageContext = createContext<StageApi | null>(null);

export function useStage() {
  const stage = useContext(StageContext);
  if (!stage) throw new Error('useStage 는 <Stage> 안에서만 쓸 수 있어요.');
  return stage;
}
