import { StyleSheet } from 'react-native';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';

import type { LineDrag } from '@/features/commentary/components/gesture-star';
import { H, W } from '@/features/commentary/constants/layout';
import { STAR } from '@/features/commentary/constants/theme';

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = { drag: LineDrag };

// 손가락으로 긋는 중인 노란 점선. 위치는 UI 스레드에서 바로 바뀌어서 손가락을 늦지 않게 따라와요.
export default function DragLine({ drag }: Props) {
  const { from, end, targets } = drag;

  const lineProps = useAnimatedProps(() => {
    const start = targets.value.find((t) => t.id === from.value);
    return {
      x1: start?.x ?? 0,
      y1: start?.y ?? 0,
      x2: end.value.x,
      y2: end.value.y,
      strokeOpacity: start ? 1 : 0,
    };
  });
  const dotProps = useAnimatedProps(() => ({
    cx: end.value.x,
    cy: end.value.y,
    opacity: from.value >= 0 ? 1 : 0,
  }));

  return (
    <Svg width={W} height={H} style={styles.layer} pointerEvents="none">
      <AnimatedLine
        stroke={STAR.yellow.c300}
        strokeWidth={3}
        strokeDasharray="6 7"
        strokeLinecap="round"
        animatedProps={lineProps}
      />
      <AnimatedCircle
        r={9}
        fill="rgba(253,224,71,0.35)"
        stroke={STAR.yellow.c300}
        strokeWidth={2}
        animatedProps={dotProps}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0, top: 0, zIndex: 2 },
});
