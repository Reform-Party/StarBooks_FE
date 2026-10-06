import { Animated } from 'react-native';

import JellyStar from '@/features/commentary/components/jelly-star';
import type { StarColor } from '@/features/commentary/constants/theme';
import { useFloat } from '@/features/commentary/hooks/use-motion';

type Props = { color: StarColor; size: number; variant?: 'slow' | 'alt' };

export default function FloatStar({ color, size, variant = 'slow' }: Props) {
  const float = useFloat(variant);
  return (
    <Animated.View style={float}>
      <JellyStar color={color} size={size} />
    </Animated.View>
  );
}
