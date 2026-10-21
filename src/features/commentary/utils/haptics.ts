import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// 디자인의 햅틱 지점에서 불러요. 안드로이드는 Vibrator 대신 시스템 햅틱을 써요(expo-haptics 권장).
// 저전력 모드 · 지원 안 하는 기기에서는 조용히 넘어가요.
type Kind = 'tap' | 'confirm' | 'longPress';

const ANDROID: Record<Kind, Haptics.AndroidHaptics> = {
  tap: Haptics.AndroidHaptics.Context_Click,
  confirm: Haptics.AndroidHaptics.Confirm,
  longPress: Haptics.AndroidHaptics.Long_Press,
};
const IMPACT: Record<Kind, Haptics.ImpactFeedbackStyle> = {
  tap: Haptics.ImpactFeedbackStyle.Light,
  confirm: Haptics.ImpactFeedbackStyle.Medium,
  longPress: Haptics.ImpactFeedbackStyle.Medium,
};

export function haptic(kind: Kind = 'tap') {
  const run =
    Platform.OS === 'android'
      ? Haptics.performAndroidHapticsAsync(ANDROID[kind])
      : Haptics.impactAsync(IMPACT[kind]);
  run.catch(() => undefined);
}
