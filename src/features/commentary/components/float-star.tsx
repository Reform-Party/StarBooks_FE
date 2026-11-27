import { Animated } from 'react-native';

import JellyStar from '@/components/ui/jelly-star';
import type { StarColor } from '@/constants/colors';
import { useFloat } from '@/features/commentary/hooks/use-motion';

type Props = { color: StarColor; size: number; variant?: 'slow' | 'alt' };

export default function FloatStar({ color, size, variant = 'slow' }: Props) {
  const float = useFloat(variant);
  return (
    <Animated.View style={float}>
      <JellyStar color={color} size={size} glow />
    </Animated.View>
  );
}
