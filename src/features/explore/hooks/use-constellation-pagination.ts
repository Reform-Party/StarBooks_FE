import { useCallback, useMemo, useState } from 'react';
import { PanResponder } from 'react-native';

export type ConstellationPagination = {
  page: number;
  totalPages: number;
  totalElements: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPageChange: (page: number) => void;
};

export function useConstellationPagination(
  { page, totalPages, hasPrevious, hasNext, onPageChange }: ConstellationPagination,
  blocked: boolean,
) {
  const [direction, setDirection] = useState<-1 | 0 | 1>(0);

  const movePage = useCallback(
    (step: -1 | 1) => {
      if (blocked) return;
      if (step === -1 && !hasPrevious) return;
      if (step === 1 && !hasNext) return;

      const nextPage = page + step;
      if (nextPage < 0 || nextPage >= totalPages) return;

      setDirection(step);
      onPageChange(nextPage);
    },
    [blocked, hasPrevious, hasNext, page, totalPages, onPageChange],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          !blocked &&
          gesture.numberActiveTouches === 1 &&
          Math.abs(gesture.dx) > 12 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
        onPanResponderRelease: (_, gesture) => {
          if (Math.abs(gesture.dx) < 50 || Math.abs(gesture.dx) <= Math.abs(gesture.dy) * 1.5) {
            return;
          }

          movePage(gesture.dx < 0 ? 1 : -1);
        },
        onPanResponderTerminationRequest: () => true,
      }),
    [blocked, movePage],
  );

  return { direction, movePage, panResponder };
}
