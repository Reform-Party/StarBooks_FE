import Svg, { Path } from 'react-native-svg';

import { INK } from '@/features/commentary/constants/theme';

// 디자인 symbol 과 같은 패스
const ICONS = {
  home: ['M3 10.5 12 3l9 7.5', 'M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5'],
  x: ['M18 6 6 18M6 6l12 12'],
  right: ['m9 18 6-6-6-6'],
  check: ['M20 6 9 17l-5-5'],
  arrow: ['M4 12h15M13 6l6 6-6 6'],
} as const;

export type IconName = keyof typeof ICONS;

type Props = { name: IconName; size?: number; color?: string };

export default function Icon({ name, size = 20, color = INK[1] }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {ICONS[name].map((d) => (
        <Path
          key={d}
          d={d}
          stroke={color}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
