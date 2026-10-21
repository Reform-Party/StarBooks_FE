import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import Text from '@/features/commentary/components/app-text';
import { TOAST_RECT } from '@/features/commentary/constants/board';
import { FONT } from '@/constants/fonts';
import { INK, STAR } from '@/constants/colors';
import { TYPE } from '@/constants/typography';

// raised: 퀴즈 모달 위에 띄울 때
type Props = { visible: boolean; title?: string; sub?: string; raised?: boolean };

// 오답 안내: 분홍 "아쉬워요!" (디자인 c1-wrong)
export default function WrongToast({
  visible,
  title = '아쉬워요!',
  sub = '다른 곳에 놓아볼까요?',
  raised = false,
}: Props) {
  const v = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    Animated.spring(v, {
      toValue: visible ? 1 : 0,
      friction: 7,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [visible, v]);
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        styles.box,
        raised && styles.raised,
        {
          opacity: v,
          transform: [
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
          ],
        },
      ]}
    >
      <View style={styles.bg} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="toast-bg" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#6B2F63" />
              <Stop offset="1" stopColor="#1A1D47" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#toast-bg)" />
        </Svg>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={[TYPE.caption, styles.sub]}>{sub}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    left: TOAST_RECT.left,
    top: TOAST_RECT.top,
    width: TOAST_RECT.w,
    height: TOAST_RECT.h,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: STAR.pink.rim,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    zIndex: 20,
    boxShadow: '0px 18px 50px rgba(0,0,0,0.5)',
  },
  // 공용 CenterModal(zIndex 100) 위에 떠야 해요
  raised: { zIndex: 110 },
  bg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 22,
    overflow: 'hidden',
  },
  title: {
    fontFamily: FONT.hand,
    fontSize: 33.5,
    lineHeight: 36,
    color: STAR.pink.rim,
    textShadowColor: 'rgba(244,114,182,0.8)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 1 },
  },
  sub: { color: INK[1], fontSize: 16, textAlign: 'center' },
});
