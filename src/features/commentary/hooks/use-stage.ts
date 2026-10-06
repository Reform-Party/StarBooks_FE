import { createContext, useContext } from 'react';

import type { Point } from '@/features/commentary/constants/layout';

type StageApi = {
  // 손가락 위치(pageX, pageY)를 874 × 402 디자인 좌표로 바꿔요.
  toDesign: (pageX: number, pageY: number) => Point;
  measure: () => void;
};

export const StageContext = createContext<StageApi | null>(null);

export function useStage() {
  const stage = useContext(StageContext);
  if (!stage) throw new Error('useStage 는 <Stage> 안에서만 쓸 수 있어요.');
  return stage;
}
