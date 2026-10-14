import { StyleSheet, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';

import JellyStar from '@/components/ui/jelly-star';
import type { StarColor } from '@/constants/colors';

const TURN_MS = 9000; // 기다리는 동안 보이도록 한 바퀴 9s
const RING_R = 104;
const STAR_SIZE = 44;

type Props = {
  tones: readonly StarColor[];
  // false 면 그 자리에서 멈춰요. (생성 실패)
  running: boolean;
};

// 세 별을 세로축 둘레 고리에 120° 간격으로 두고 회전목마처럼 돌려요.
// 고리를 살짝 기울여(앞 별은 아래, 뒤 별은 위) 앞뒤로 겹쳐도 가려지지 않아요.
export default function StarCarousel({ tones, running }: Props) {
  const reduced = useReducedMotion();
  const theta = useSharedValue(0);

  useFrameCallback((frame) => {
    const dt = frame.timeSincePreviousFrame ?? 0;
    theta.set(theta.get() + (dt / TURN_MS) * 2 * Math.PI);
  }, running && !reduced);

  return (
    <View style={[styles.root, !running && styles.stopped]} pointerEvents="none">
      {tones.map((tone, i) => (
        <CarouselStar key={tone} index={i} tone={tone} theta={theta} />
      ))}
    </View>
  );
}

function CarouselStar({
  index,
  tone,
  theta,
}: {
  index: number;
  tone: StarColor;
  theta: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    // θ = 0 이면 x ≈ -90 · 0 · 90 (Figma 의 한 줄 배치)
    const phi = theta.get() + ((index - 1) * 2 * Math.PI) / 3;
    const depth = RING_R * Math.cos(phi);
    return {
      zIndex: Math.round(depth + 200),
      transform: [
        { translateX: RING_R * Math.sin(phi) },
        { translateY: depth * 0.18 },
        { scale: 1 + depth / 800 },
      ],
    };
  });
  return (
    <Animated.View style={[styles.star, style]}>
      <JellyStar color={tone} size={STAR_SIZE} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // 별 중심 y 217 · 가운데 x 437
  root: { position: 'absolute', left: 437, top: 217, width: 0, height: 0 },
  stopped: { opacity: 0.55 },
  star: { position: 'absolute', left: -STAR_SIZE / 2, top: -STAR_SIZE / 2 },
});
