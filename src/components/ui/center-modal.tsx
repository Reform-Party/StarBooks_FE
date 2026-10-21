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
  // 스크림을 누르거나 안드로이드 뒤로 가기를 눌렀을 때. 없으면 스크림을 눌러도 닫히지 않아요.
  onRequestClose?: () => void;
  panelStyle?: StyleProp<ViewStyle>;
  // 패널 위치(캔버스 위에서부터 pt). 없으면 가운데예요.
  top?: number;
  // 스크림 색. 없으면 PANEL.scrim (예: 뒤 화면이 비쳐 보여야 하는 완성 화면)
  scrimColor?: string;
  children: ReactNode;
};

// 화면 가운데 뜨는 패널 + 어두운 스크림.
// RN Modal 대신 부모 화면 위에 겹쳐 그려서, 874 × 402 디자인 좌표를 그대로 써요.
// 부모 화면의 가장 마지막 자식으로 두세요.
export default function CenterModal({
  visible,
  onRequestClose,
  panelStyle,
  top,
  scrimColor,
  children,
}: Props) {
  useEffect(() => {
    if (!visible || !onRequestClose) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onRequestClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onRequestClose]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(DURATION.modal)}
      exiting={FadeOut.duration(DURATION.menu).easing(Easing.in(Easing.ease))}
      style={[
        styles.scrim,
        top != null && { justifyContent: 'flex-start', paddingTop: top },
        scrimColor != null && { backgroundColor: scrimColor },
      ]}
      accessibilityViewIsModal
      onAccessibilityEscape={onRequestClose}
    >
      <Pressable
        accessible={false}
        disabled={!onRequestClose}
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
