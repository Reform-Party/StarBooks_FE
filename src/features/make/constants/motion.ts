import { Keyframe } from 'react-native-reanimated';

import { SPRING_EASING } from '@/constants/motion';

// 별을 고르면 젤리 별이 톡 튀어나와요. (0.7 → 1.12 → 1 · 0.35s 스프링)
export const STAR_POP = new Keyframe({
  0: { transform: [{ scale: 0.7 }] },
  60: { transform: [{ scale: 1.12 }], easing: SPRING_EASING },
  100: { transform: [{ scale: 1 }] },
}).duration(350);
