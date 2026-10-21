import { type ReactNode, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { SCREEN } from '@/constants/layout';
import { type CanvasFrame as Frame, CanvasContext } from '@/features/commentary/hooks/use-canvas';

type Props = { children: ReactNode };

// 공용 Stage 의 캔버스 안에 깔아, 그 캔버스가 화면 어디에 몇 배로 그려졌는지 재요.
// 끌어서 놓기 · 선 긋기가 손가락 위치를 디자인 좌표로 바꿀 때 써요.
export default function CanvasFrame({ children }: Props) {
  const ref = useRef<View>(null);
  const frame = useSharedValue<Frame>({ x: 0, y: 0, scale: 1 });

  const measure = useCallback(() => {
    ref.current?.measureInWindow((x, y, width) => {
      if (width > 0) frame.set({ x, y, scale: width / SCREEN.width });
    });
  }, [frame]);

  const api = useMemo(() => ({ frame, measure }), [frame, measure]);

  return (
    <View ref={ref} onLayout={measure} style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <CanvasContext.Provider value={api}>{children}</CanvasContext.Provider>
    </View>
  );
}
