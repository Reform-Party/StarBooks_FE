import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import BrandTitle from '@/components/ui/brand-title';
import JellyButton from '@/components/ui/jelly-button';
import Stage from '@/components/ui/stage';
import { INK, STAR } from '@/constants/colors';
import { TYPE } from '@/constants/typography';
import { MAKE_STEPS } from '@/features/make/constants/story-options';
import StarCarousel from '@/features/story/components/star-carousel';

const TONES = MAKE_STEPS.map((s) => s.tone);

type Props = {
  // 실패했을 때의 안내 문구. 없으면 만드는 중이에요.
  error: string | null;
  onRetry: () => void;
  onHome: () => void;
};

// 기본 · 만드는 중 (Figma design)
//  상시: 별자리 회전 애니메이션 재사용 (세 별이 화면 세로축을 돌아요) · 말줄임 점 2s 반복
//  2 준비 완료: 읽기 화면으로 자동 이동 (라우트에서 처리)
//  3 생성 실패: 오류 안내 + 다시 시도 · 별 회전 멈춤
export default function GeneratingScreen({ error, onRetry, onHome }: Props) {
  const failed = error != null;
  return (
    <Stage>
      <View style={styles.brand}>
        <BrandTitle size={28} />
      </View>
      <View style={styles.heading} accessibilityLiveRegion="polite">
        <Text accessibilityRole="header" style={[TYPE.heading, styles.headingText]}>
          {failed ? '동화를 만들지 못했어요' : '마법 같은 동화를 만들고 있어요'}
        </Text>
        {failed ? null : <BlinkDots />}
      </View>

      <StarCarousel tones={TONES} running={!failed} />

      {failed ? (
        <View style={styles.errorArea}>
          <Text accessibilityRole="alert" style={[TYPE.caption, styles.errorText]}>
            {error}
          </Text>
          <View style={styles.buttons}>
            <JellyButton tone="glass" label="메인으로" onPress={onHome} />
            <JellyButton label="다시 시도" onPress={onRetry} />
          </View>
        </View>
      ) : (
        <Text style={[TYPE.caption, styles.caption]}>다 만들어지면 바로 책이 열려요</Text>
      )}
    </Stage>
  );
}

// 말줄임 점이 하나씩 켜지는 2s 반복
function BlinkDots() {
  return (
    <View style={styles.dots} accessible={false}>
      {[0, 300, 600].map((delay) => (
        <Dot key={delay} delay={delay} />
      ))}
    </View>
  );
}

function Dot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.set(
      withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(0, { duration: 400 }),
            withTiming(1, { duration: 400 }),
            withTiming(1, { duration: 1200 }),
          ),
          -1,
        ),
      ),
    );
  }, [delay, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  return <Animated.Text style={[TYPE.heading, styles.headingText, style]}>.</Animated.Text>;
}

const styles = StyleSheet.create({
  brand: { position: 'absolute', top: 18, left: 0, right: 0, alignItems: 'center' },
  heading: {
    position: 'absolute',
    top: 86,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  headingText: { color: INK[1] },
  dots: { flexDirection: 'row' },
  caption: {
    position: 'absolute',
    top: 284,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: INK[3],
  },
  errorArea: { position: 'absolute', top: 270, left: 0, right: 0, alignItems: 'center', gap: 14 },
  errorText: { color: STAR.pink.c300 },
  buttons: { flexDirection: 'row', gap: 12 },
});
