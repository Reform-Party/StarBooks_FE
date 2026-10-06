import { type ReactNode, useEffect, useState } from 'react';
import {
  Animated,
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import { H, SB, W } from '@/features/commentary/constants/layout';
import { GLASS, RADIUS } from '@/features/commentary/constants/theme';

type Props = {
  width: number;
  // 디자인 위치(pt). 없으면 화면 가운데
  top?: number;
  scrimOpacity?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

// 화면 가운데 뜨는 패널 + 어두운 막. 스프링으로 톡 튀어나와요.
export default function CenterModal({ width, top, scrimOpacity = 0.62, style, children }: Props) {
  const v = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    Animated.spring(v, { toValue: 1, friction: 6, tension: 130, useNativeDriver: true }).start();
  }, [v]);
  return (
    <View style={styles.cover} accessibilityViewIsModal>
      <Pressable
        accessible={false}
        style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(5,6,18,${scrimOpacity})` }]}
      />
      <View
        style={[styles.center, top != null && { justifyContent: 'flex-start', paddingTop: top }]}
        pointerEvents="box-none"
      >
        <Animated.View
          style={{
            opacity: v,
            transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
          }}
        >
          <View style={[styles.panel, { width }, style]}>{children}</View>
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
    backgroundColor: GLASS.panel,
    borderWidth: 1,
    borderColor: GLASS.line,
    borderRadius: RADIUS.l,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 18 },
  },
});
