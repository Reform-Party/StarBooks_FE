import { createContext, useContext } from 'react';
import type { SharedValue } from 'react-native-reanimated';

import type { Point } from '@/features/commentary/constants/board';

export type CanvasFrame = { x: number; y: number; scale: number };

type CanvasApi = {
  // 캔버스가 화면 어디에, 몇 배로 그려졌는지. 제스처(UI 스레드)에서도 읽어요.
  frame: SharedValue<CanvasFrame>;
  measure: () => void;
};

export const CanvasContext = createContext<CanvasApi | null>(null);

export function useCanvas() {
  const canvas = useContext(CanvasContext);
  if (!canvas) throw new Error('useCanvas 는 <CanvasFrame> 안에서만 쓸 수 있어요.');
  return canvas;
}

// 손가락 위치(화면 좌표)를 874 × 402 디자인 좌표로 바꿔요. 제스처 콜백(worklet)에서 불러요.
export function toDesign(frame: CanvasFrame, absX: number, absY: number): Point {
  'worklet';
  return { x: (absX - frame.x) / frame.scale, y: (absY - frame.y) / frame.scale };
}
