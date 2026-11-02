import { type ReactNode, useEffect } from 'react';
import { BackHandler, Pressable, type StyleProp, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, Keyframe } from 'react-native-reanimated';

import Panel from '@/components/ui/panel';
import { PANEL } from '@/constants/colors';
import { DURATION, SPRING_EASING } from '@/constants/motion';

// 열 때: 스크림 + 모달 팝 0.3s / 닫을 때: 0.2s ease-in
const POP_IN = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.9 }] },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: SPRING_EASING },
}).duration(DURATION.modal);

type Props = {
  visible: boolean;
  // 안드로이드 뒤로 가기 · VoiceOver 두 손가락 Z (+ dismissOnScrimPress 면 스크림 탭) 때.
  // 보이는 동안 뒤로 가기는 항상 모달이 받아서, 없어도 아래 화면이 pop 되지 않아요.
  onRequestClose?: () => void;
  // 스크림을 눌러도 닫을지. 녹음처럼 실수로 닫히면 안 되는 모달은 false 로 두세요.
  dismissOnScrimPress?: boolean;
  panelStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
};

// 화면 가운데 뜨는 패널 + 어두운 스크림.
// RN Modal 대신 부모 화면 위에 겹쳐 그려서, 874 × 402 디자인 좌표를 그대로 써요.
// 부모 화면의 가장 마지막 자식으로 두세요.
// accessibilityViewIsModal 은 iOS 전용이라, 안드로이드 TalkBack 이 뒤 화면으로 가지 않게
// 부모가 모달이 열린 동안 나머지 형제를 감싼 뷰에 importantForAccessibility 를 줘야 해요.
//   <View importantForAccessibility={visible ? 'no-hide-descendants' : 'auto'}>…</View>
//   <CenterModal visible={visible} … />
export default function CenterModal({
  visible,
  onRequestClose,
  dismissOnScrimPress = true,
  panelStyle,
  children,
}: Props) {
  useEffect(() => {
    if (!visible) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onRequestClose?.();
      return true;
    });
    return () => sub.remove();
  }, [visible, onRequestClose]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(DURATION.modal)}
      exiting={FadeOut.duration(DURATION.menu).easing(Easing.in(Easing.ease))}
      style={styles.scrim}
      accessibilityViewIsModal
      onAccessibilityEscape={onRequestClose}
    >
      <Pressable
        accessible={false}
        disabled={!onRequestClose || !dismissOnScrimPress}
        onPress={onRequestClose}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View entering={POP_IN}>
        <Panel style={panelStyle}>{children}</Panel>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    // 펼친 목록처럼 zIndex 를 가진 형제보다 항상 위에 그려요.
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PANEL.scrim,
  },
});
