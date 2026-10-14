import Svg, { Path } from 'react-native-svg';

import { STAR_PATH, VIEW_H, VIEW_W } from '@/components/ui/jelly-star';
import { STAR, type StarColor } from '@/constants/colors';

type Props = {
  color: StarColor;
  size: number;
};

// 아직 고르지 않은 별: 젤리 별과 같은 모양의 점선 테두리
export default function OutlineStar({ color, size }: Props) {
  return (
    <Svg width={size} height={(size * VIEW_H) / VIEW_W} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
      <Path
        d={STAR_PATH}
        fill="rgba(255,255,255,0.04)"
        stroke={STAR[color].c300}
        strokeOpacity={0.85}
        strokeWidth={0.9}
        strokeDasharray="1.8 1.8"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
