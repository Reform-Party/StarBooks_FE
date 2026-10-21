import { memo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';

import { STAR, type StarColor, withAlpha } from '@/features/commentary/constants/theme';

const STAR_PATH =
  'M 80 18 C 84.5 18 89.2 25.8 95.8 40.8 C 98.7 47.4 104.6 51.7 111.8 52.2 C 128.1 53.4 135.9 57.8 137.3 62.1 C 138.8 66.4 132.8 74.5 119.3 84.1 C 113.3 88.4 111.1 95.2 113.8 102.1 C 119.8 117.4 117.9 125.7 114.2 128.4 C 110.6 131.1 100.8 126.3 87.8 116.7 C 82.0 112.4 78.0 112.4 72.2 116.7 C 59.2 126.3 49.4 131.1 45.8 128.4 C 42.1 125.7 40.2 117.4 46.2 102.1 C 48.9 95.2 46.7 88.4 40.7 84.1 C 27.2 74.5 21.2 66.4 22.7 62.1 C 24.1 57.8 31.9 53.4 48.2 52.2 C 55.4 51.7 61.3 47.4 64.2 40.8 C 70.8 25.8 75.5 18 80 18 Z';

type Props = {
  // grey = 아직 분류 전
  color?: StarColor | 'grey';
  size?: number;
  glow?: boolean;
  // 오답 때 위에 겹치는 붉은 틴트 (별 모양 그대로)
  tinted?: boolean;
};

// 메인 화면의 둥근 별. 왼쪽 위 흰 광택 + 같은 색 그림자로 말랑하게.
function JellyStar({ color = 'yellow', size = 36, glow = true, tinted = false }: Props) {
  if (tinted) {
    return (
      <Svg width={size} height={size} viewBox="0 0 160 160">
        <Path d={STAR_PATH} fill="rgba(239,68,68,0.6)" stroke="#F87171" strokeWidth={3} />
      </Svg>
    );
  }
  if (color === 'grey') {
    return (
      <Svg width={size} height={size} viewBox="0 0 160 160">
        <Path
          d={STAR_PATH}
          fill="#E2E8F0"
          stroke="#CBD5E1"
          strokeWidth={3}
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  const c = STAR[color];
  const star = (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Defs>
        <RadialGradient id={`js-${color}`} cx="38%" cy="28%" r="68%">
          <Stop offset="0" stopColor={c.g0} />
          <Stop offset="0.25" stopColor={c.g1} />
          <Stop offset="0.7" stopColor={c.g2} />
          <Stop offset="1" stopColor={c.g3} />
        </RadialGradient>
      </Defs>
      <Path
        d={STAR_PATH}
        fill={`url(#js-${color})`}
        stroke={c.rim}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Ellipse
        cx={63}
        cy={54}
        rx={13}
        ry={7}
        fill="#fff"
        opacity={0.6}
        transform="rotate(-32 63 54)"
      />
    </Svg>
  );
  if (!glow) return star;
  // Glow (디자인 문서 06): drop-shadow 0 8 16 (색 45%) + 0 2 6 (색 30%)
  // 안드로이드는 filter 의 drop-shadow 로 별 모양 그대로 빛을 줘요(New Architecture).
  if (Platform.OS === 'android') {
    return (
      <View
        style={{
          width: size,
          height: size,
          filter: `drop-shadow(0px 8px 16px ${withAlpha(c.g1, 0.45)}) drop-shadow(0px 2px 6px ${withAlpha(c.g1, 0.3)})`,
        }}
      >
        {star}
      </View>
    );
  }
  if (Platform.OS !== 'ios') return star;
  // iOS 는 그림자가 별 모양을 따라가서 두 겹으로 겹쳐요.
  return (
    <View style={[styles.glowOuter, { width: size, height: size, shadowColor: c.g1 }]}>
      <View style={[styles.glowInner, { shadowColor: c.g1 }]}>{star}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  glowOuter: { shadowOpacity: 0.45, shadowRadius: 8, shadowOffset: { width: 0, height: 8 } },
  glowInner: { shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 2 } },
});

export default memo(JellyStar);
