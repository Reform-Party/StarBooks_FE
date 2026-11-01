import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import FloatingIsland from '@/features/explore/components/floating-island';
import {
  BACKGROUND_BASE,
  BACKGROUND_GLOW,
  ISLANDS,
  STAGE_COLORS,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  TITLE_FONT,
  type Island,
} from '@/features/explore/constants/islands';

type Props = {
  onSelectIsland?: (island: Island) => void;
};

const DOT_COUNT = 18;

// 섬 사이를 잇는 점선: 시작점, 가운데 조절점, 끝점으로 곡선을 그리고 점을 찍습니다.
const START = { x: 295, y: 218 };
const CONTROL = { x: 437, y: 50 };
const END = { x: 605, y: 200 };

const DOTS = Array.from({ length: DOT_COUNT }, (_, i) => {
  const t = i / (DOT_COUNT - 1);
  const u = 1 - t;
  return {
    x: u * u * START.x + 2 * u * t * CONTROL.x + t * t * END.x,
    y: u * u * START.y + 2 * u * t * CONTROL.y + t * t * END.y,
  };
});

export default function IslandSelectScreen({ onSelectIsland }: Props) {
  const { width, height } = useWindowDimensions();
  const scale = Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT);

  // 폰트를 불러오는 동안에는 기본 글꼴로 먼저 보여줍니다.
  const [fontsLoaded] = useFonts({
    [TITLE_FONT]: require('@/features/explore/assets/fonts/Gaegu-Bold.ttf'),
  });

  return (
    <View style={styles.root}>
      {/* 폰 크기에 맞춰 874 x 402 화면을 줄이거나 키웁니다. */}
      <View style={[styles.stage, { transform: [{ scale }] }]}>
        <Image source={BACKGROUND_BASE} style={StyleSheet.absoluteFill} contentFit="cover" />
        <Image source={BACKGROUND_GLOW} style={StyleSheet.absoluteFill} contentFit="cover" />

        {DOTS.map((dot, i) => (
          <View key={i} style={[styles.dot, { left: dot.x - 1.5, top: dot.y - 1.5 }]} />
        ))}

        <View style={styles.titleBox}>
          <Text style={[styles.title, fontsLoaded && { fontFamily: TITLE_FONT }]}>
            테마를 선택해주세요!
          </Text>
          <Text style={styles.subtitle}>내가 만든 동화가 섬마다 모여 있어요</Text>
        </View>

        {ISLANDS.map((island) => (
          <FloatingIsland key={island.id} island={island} onPress={onSelectIsland} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#04050D',
  },
  stage: {
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
    overflow: 'hidden',
    borderRadius: 55,
    backgroundColor: STAGE_COLORS.background,
  },
  dot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: STAGE_COLORS.dot,
  },
  titleBox: {
    position: 'absolute',
    top: 16,
    width: STAGE_WIDTH,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: STAGE_COLORS.title,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13,
    color: STAGE_COLORS.subtitle,
  },
});
