import { memo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';

import { STAR, type StarColor } from '@/features/commentary/constants/theme';

const STAR_PATH =
  'M 80 18 C 84.5 18 89.2 25.8 95.8 40.8 C 98.7 47.4 104.6 51.7 111.8 52.2 C 128.1 53.4 135.9 57.8 137.3 62.1 C 138.8 66.4 132.8 74.5 119.3 84.1 C 113.3 88.4 111.1 95.2 113.8 102.1 C 119.8 117.4 117.9 125.7 114.2 128.4 C 110.6 131.1 100.8 126.3 87.8 116.7 C 82.0 112.4 78.0 112.4 72.2 116.7 C 59.2 126.3 49.4 131.1 45.8 128.4 C 42.1 125.7 40.2 117.4 46.2 102.1 C 48.9 95.2 46.7 88.4 40.7 84.1 C 27.2 74.5 21.2 66.4 22.7 62.1 C 24.1 57.8 31.9 53.4 48.2 52.2 C 55.4 51.7 61.3 47.4 64.2 40.8 C 70.8 25.8 75.5 18 80 18 Z';

type Props = {
  // grey = 아직 분류 전
  color?: StarColor | 'grey';
  size?: number;
  glow?: boolean;
};

// 메인 화면의 둥근 별. 왼쪽 위 흰 광택 + 같은 색 그림자로 말랑하게.
function JellyStar({ color = 'yellow', size = 36, glow = true }: Props) {
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
  // iOS 는 별 모양 그대로 그림자가 져서 '같은 색 빛'이 돼요. 안드로이드/웹은 네모 그림자가 생겨 끕니다.
  if (!glow || Platform.OS !== 'ios') return star;
  return (
    <View
      style={[
        styles.glow,
        {
          width: size,
          height: size,
          shadowColor: c.g1,
          shadowRadius: Math.max(4, size * 0.12),
          shadowOffset: { width: 0, height: Math.max(2, size * 0.06) },
        },
      ]}
    >
      {star}
    </View>
  );
}

const styles = StyleSheet.create({ glow: { shadowOpacity: 0.55 } });

export default memo(JellyStar);
