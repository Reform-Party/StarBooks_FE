import type { FontSource } from 'expo-font';

import { FONT } from '@/features/commentary/constants/theme';

// 라이선스: Gaegu · Pretendard = SIL OFL 1.1 / ONE 모바일 POP = ㈜원스토어 (앱 탑재 가능, 파일 수정·재배포 금지)
export const COMMENTARY_FONTS: Record<(typeof FONT)[keyof typeof FONT], FontSource> = {
  [FONT.hand]: require('@/assets/fonts/Gaegu-Bold.ttf'),
  [FONT.pop]: require('@/assets/fonts/ONE-Mobile-POP.ttf'),
  [FONT.sans]: require('@/assets/fonts/Pretendard-Medium.ttf'),
  [FONT.sansSemi]: require('@/assets/fonts/Pretendard-SemiBold.ttf'),
  [FONT.sansBold]: require('@/assets/fonts/Pretendard-Bold.ttf'),
};
