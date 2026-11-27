import { StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { INK, PANEL, STAR } from '@/constants/colors';
import { RADIUS } from '@/constants/layout';
import { DURATION } from '@/constants/motion';
import { TYPE } from '@/constants/typography';
import type { ToastState } from '@/hooks/use-toast';

type Props = {
  toast: ToastState;
  // 캔버스 위에서부터의 거리 (아래 버튼 위 · 위쪽 아이콘 줄 등 화면마다 달라요)
  top: number;
};

// 짧은 안내 (예: "교훈 별을 하나 골라 주세요"). Figma 에 따로 없어 Panel 색 + 노란 테두리로 만들었어요.
// 부모 화면의 마지막 자식으로 두세요.
export default function Toast({ toast, top }: Props) {
  if (!toast) return null;
  return (
    <Animated.View
      key={toast.id}
      entering={FadeIn.duration(DURATION.menu)}
      exiting={FadeOut.duration(DURATION.menu)}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[styles.row, { top }]}
    >
      <Text accessibilityRole="alert" style={[TYPE.body, styles.box]}>
        {toast.message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { position: 'absolute', left: 20, right: 20, zIndex: 90, alignItems: 'center' },
  box: {
    maxWidth: 480,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: `${STAR.yellow.c300}99`,
    backgroundColor: PANEL.fill,
    overflow: 'hidden',
    color: INK[1],
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },
});
