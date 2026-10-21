import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { STAR, type StarColor } from '@/constants/colors';

// Figma 젤리 별 (프로필 사진 속 별과 같은 모양)
const VIEW_W = 35.4151;
const VIEW_H = 34.2436;
const STAR_PATH =
  'M17.7076 0.45C19.0576 0.45 20.4676 2.79 22.4476 7.29C23.3176 9.27 25.0876 10.56 27.2476 10.71C32.1376 11.07 34.4776 12.39 34.8976 13.68C35.3476 14.97 33.5476 17.4 29.4976 20.28C27.6976 21.57 27.0376 23.61 27.8476 25.68C29.6476 30.27 29.0776 32.76 27.9676 33.57C26.8876 34.38 23.9476 32.94 20.0476 30.06C18.3076 28.77 17.1076 28.77 15.3676 30.06C11.4676 32.94 8.52756 34.38 7.44756 33.57C6.33756 32.76 5.76756 30.27 7.56756 25.68C8.37756 23.61 7.71756 21.57 5.91756 20.28C1.86756 17.4 0.0675571 14.97 0.517557 13.68C0.937557 12.39 3.27756 11.07 8.16756 10.71C10.3276 10.56 12.0976 9.27 12.9676 7.29C14.9476 2.79 16.3576 0.45 17.7076 0.45Z';
// 왼쪽 위 흰 광택
const SHINE_PATH =
  'M13.7204 13.0309C15.547 11.8895 16.5295 10.1669 15.9149 9.18331C15.3003 8.19975 13.3213 8.3277 11.4947 9.4691C9.66811 10.6105 8.68557 12.3331 9.30017 13.3167C9.91477 14.3002 11.8938 14.1723 13.7204 13.0309Z';

type Props = {
  color?: StarColor;
  // 가로 크기(pt). 세로는 비율대로 맞춰요.
  size?: number;
  // Glow (Figma 06): drop-shadow 0 8 16 (색 45%) + 0 2 6 (색 30%)
  glow?: boolean;
  // 이 색 한 가지로 칠한 별 (예: 오답 때 위에 겹치는 붉은 틴트)
  tint?: string;
};

const hexToRgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

// 메인 화면의 둥근 별. 왼쪽 위 흰 광택과 같은 색 테두리로 말랑한 느낌을 내요.
export default function JellyStar({ color = 'yellow', size = VIEW_W, glow = false, tint }: Props) {
  const c = STAR[color];
  const id = `jelly-star-${color}`;
  const height = (size * VIEW_H) / VIEW_W;
  if (tint) {
    return (
      <Svg width={size} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
        <Path d={STAR_PATH} fill={tint} strokeLinejoin="round" />
      </Svg>
    );
  }
  const star = (
    <Svg width={size} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
      <Defs>
        <RadialGradient
          id={id}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(13.5658 9.78623) scale(23.4702 22.6737)"
        >
          <Stop offset="0" stopColor={c.hi} />
          <Stop offset="0.25" stopColor={c.c300} />
          <Stop offset="0.7" stopColor={c.c500} />
          <Stop offset="1" stopColor={c.deep} />
        </RadialGradient>
      </Defs>
      <Path
        d={STAR_PATH}
        fill={`url(#${id})`}
        stroke={c.rim}
        strokeWidth={0.9}
        strokeLinejoin="round"
      />
      <Path d={SHINE_PATH} fill="#fff" opacity={0.6} />
    </Svg>
  );
  if (!glow) return star;
  // 안드로이드는 filter 의 drop-shadow 로 별 모양 그대로 빛을 줘요 (New Architecture).
  if (Platform.OS === 'android') {
    return (
      <View
        style={{
          width: size,
          height,
          filter: `drop-shadow(0px 8px 16px ${hexToRgba(c.c300, 0.45)}) drop-shadow(0px 2px 6px ${hexToRgba(c.c300, 0.3)})`,
        }}
      >
        {star}
      </View>
    );
  }
  // iOS 는 그림자가 별 모양을 따라가서 두 겹으로 겹쳐요.
  return (
    <View style={[styles.glowOuter, { width: size, height, shadowColor: c.c300 }]}>
      <View style={[styles.glowInner, { shadowColor: c.c300 }]}>{star}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  glowOuter: { shadowOpacity: 0.45, shadowRadius: 8, shadowOffset: { width: 0, height: 8 } },
  glowInner: { shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 2 } },
});
