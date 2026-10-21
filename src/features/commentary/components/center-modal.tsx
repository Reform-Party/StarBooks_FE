import { BlurView } from 'expo-blur';
import { type ReactNode, useEffect, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import { H, SB, W } from '@/features/commentary/constants/layout';
import { MOTION } from '@/features/commentary/constants/motion';
import { GLASS, RADIUS } from '@/features/commentary/constants/theme';
import { useReduceMotion } from '@/features/commentary/hooks/use-motion';

type Props = {
  width: number;
  // 디자인 위치(pt). 없으면 화면 가운데
  top?: number;
  scrimOpacity?: number;
  // 바깥(어두운 막)을 누르면 닫혀요
  onDismiss?: () => void;
  // 3단계 완성 패널: 막 뒤의 관계선을 누를 수 있게 터치를 통과시켜요
  passThrough?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

// iOS 는 패널 뒤를 blur 16 으로 흐려요. 안드로이드는 화면 구조상 blur 대상(BlurTargetView)을
// 따로 둘 수 없어서, 대신 패널을 조금 더 진하게 칠해 글자를 읽기 쉽게 해요.
const BLUR = Platform.OS === 'ios';

// 화면 가운데 뜨는 패널 + 어두운 막. 모달 팝 0.3s (디자인 Spring 곡선)
export default function CenterModal({
  width,
  top,
  scrimOpacity = 0.62,
  onDismiss,
  passThrough = false,
  style,
  children,
}: Props) {
  const reduce = useReduceMotion();
  const v = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: reduce ? 0 : MOTION.modalPop,
      easing: MOTION.springEase,
      useNativeDriver: true,
    }).start();
  }, [v, reduce]);
  return (
    <View
      style={styles.cover}
      pointerEvents={passThrough ? 'box-none' : 'auto'}
      accessibilityViewIsModal={!passThrough}
    >
      <Pressable
        accessible={false}
        onPress={onDismiss}
        pointerEvents={passThrough ? 'none' : 'auto'}
        style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(5,6,18,${scrimOpacity})` }]}
      />
      <View
        style={[styles.center, top != null && { justifyContent: 'flex-start', paddingTop: top }]}
        pointerEvents="box-none"
      >
        <Animated.View
          style={{
            opacity: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }),
            transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
          }}
        >
          <View style={[styles.panel, !BLUR && styles.solid, { width }, style]}>
            {BLUR ? (
              <View style={styles.backdrop} pointerEvents="none">
                {/* 아래부터 blur → 패널 색(.84) → 내용 순서로 겹쳐요 */}
                <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={[StyleSheet.absoluteFill, styles.glass]} />
              </View>
            ) : null}
            {children}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 30 },
  center: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: W,
    height: H - SB,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    borderWidth: 1,
    borderColor: GLASS.line,
    borderRadius: RADIUS.l,
    boxShadow: '0px 18px 50px rgba(0,0,0,0.5)',
  },
  glass: { backgroundColor: GLASS.panel },
  solid: { backgroundColor: GLASS.panelSolid },
  // BlurView 는 borderRadius 가 안 먹어서 감싼 뷰의 overflow 로 둥글게 잘라요 (expo-blur 문서)
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: RADIUS.l,
    overflow: 'hidden',
  },
});
