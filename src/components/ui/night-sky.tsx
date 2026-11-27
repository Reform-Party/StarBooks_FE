import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { SKY } from '@/constants/colors';

// Figma Night sky (화면 배경 + 오로라 · 은하수 · 반짝이)를 874 × 402 기준 @1x · @2x · @3x 로 미리 구운 이미지예요.
// 은하수 · 오로라의 블러를 기기에서 SVG 필터로 돌리면 안드로이드에서 흐림이 약해지고 무거워져서 이미지로 써요.
const SKY_IMAGE = require('@/assets/images/night-sky.webp');

// 밤하늘 배경. 화면 비율이 874 × 402 와 달라도 빈틈 없이 덮어요.
export default function NightSky() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.sky]} pointerEvents="none">
      <Image source={SKY_IMAGE} style={StyleSheet.absoluteFill} contentFit="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  sky: { backgroundColor: SKY.deep },
});
