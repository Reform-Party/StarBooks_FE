import { type ReactNode, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { H, W } from '@/features/commentary/constants/layout';
import { SKY } from '@/features/commentary/constants/theme';
import { StageContext } from '@/features/commentary/hooks/use-stage';

type Props = { children: ReactNode };

// 874 × 402pt 디자인 좌표를 그대로 쓰고, 실제 화면에 맞춰 비율대로 키우거나 줄여요.
export default function Stage({ children }: Props) {
  const { width, height } = useWindowDimensions();
  const scale = Math.min(width / W, height / H);
  const frameRef = useRef<View>(null);
  const origin = useRef({ x: 0, y: 0 });

  const measure = useCallback(() => {
    frameRef.current?.measureInWindow((x, y) => {
      origin.current = { x, y };
    });
  }, []);

  const api = useMemo(
    () => ({
      measure,
      toDesign: (pageX: number, pageY: number) => ({
        x: (pageX - origin.current.x) / scale,
        y: (pageY - origin.current.y) / scale,
      }),
    }),
    [measure, scale],
  );

  const offset = { x: (W * scale - W) / 2, y: (H * scale - H) / 2 };

  return (
    <View style={styles.root}>
      <View
        ref={frameRef}
        onLayout={measure}
        style={[styles.frame, { width: W * scale, height: H * scale }]}
      >
        <View
          style={[
            styles.canvas,
            { transform: [{ translateX: offset.x }, { translateY: offset.y }, { scale }] },
          ]}
        >
          <StageContext.Provider value={api}>{children}</StageContext.Provider>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SKY.deep, alignItems: 'center', justifyContent: 'center' },
  frame: { overflow: 'hidden' },
  canvas: { width: W, height: H },
});
