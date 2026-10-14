import { useFocusEffect } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { type ReactNode, useCallback, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import NightSky from '@/components/ui/night-sky';
import { PORTRAIT_SCREEN, SCREEN } from '@/constants/layout';

export type StageOrientation = 'landscape' | 'portrait';

const CANVAS = {
  landscape: {
    width: SCREEN.width,
    height: SCREEN.height,
    lock: ScreenOrientation.OrientationLock.LANDSCAPE,
  },
  portrait: {
    width: PORTRAIT_SCREEN.width,
    height: PORTRAIT_SCREEN.height,
    lock: ScreenOrientation.OrientationLock.PORTRAIT_UP,
  },
} as const;

type Props = {
  orientation?: StageOrientation;
  children: ReactNode;
};

// 디자인 좌표(가로 874 × 402 · 세로 402 × 874)를 그대로 쓰고, 화면에 맞춰 비율대로 키우거나 줄여요.
// 남는 여백은 밤하늘이 채우고, 화면에 들어올 때 기기 방향을 그 캔버스에 맞춰 고정해요.
// 화면 크기 대신 자기 영역을 재서, 키보드가 올라와 영역이 줄면 캔버스도 같이 줄어요.
export default function Stage({ orientation = 'landscape', children }: Props) {
  const canvas = CANVAS[orientation];
  const [box, setBox] = useState({ width: 0, height: 0 });

  useFocusEffect(
    useCallback(() => {
      // 웹 · 일부 태블릿처럼 방향을 고정할 수 없는 곳에서는 그대로 둬요.
      ScreenOrientation.lockAsync(canvas.lock).catch(() => undefined);
    }, [canvas.lock]),
  );

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox({ width, height });
  };

  const scale = Math.min(box.width / canvas.width, box.height / canvas.height);

  return (
    <View style={styles.root} onLayout={handleLayout}>
      <NightSky />
      {box.width > 0 ? (
        <View
          style={[
            styles.canvas,
            { width: canvas.width, height: canvas.height, transform: [{ scale }] },
          ]}
        >
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  canvas: { flexShrink: 0 },
});
