import type { ReactNode } from 'react';
import { Keyboard, KeyboardAvoidingView, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import GlassIconButton from '@/components/ui/glass-icon-button';
import Panel from '@/components/ui/panel';
import Stage from '@/components/ui/stage';
import { SCREEN } from '@/constants/layout';
import { DURATION } from '@/constants/motion';

// 가로 화면은 키보드가 높이의 절반쯤을 가려서, 패널이 다 보이도록 더 작게까지 줄여요.
const KEYBOARD_MIN_FIT = 0.6;

type Props = {
  // 패널 안 맨 위 제목 (로그인의 "별나라 책방" · 회원가입의 "회원가입 1 / 2")
  header: ReactNode;
  // 왼쪽 위 뒤로 가기 버튼
  onBack?: () => void;
  backLabel?: string;
  // 알림창 · 토스트처럼 화면 전체에 겹쳐 그릴 것
  overlay?: ReactNode;
  children: ReactNode;
};

// 로그인 · 회원가입 · 아이 정보 공통 틀 (Figma design: 가로 874 × 402 · 가운데 패널 340 · 입력칸 290)
// 패널은 아래에서 12pt 올라오며 나타나요. 키보드가 올라오면 캔버스가 줄어 입력칸이 가리지 않아요.
// 너무 작아지지 않게 폭 기준 배율의 KEYBOARD_MIN_FIT 까지만 줄이고, 넘치는 위아래는 잘려요.
export default function AuthScreen({
  header,
  onBack,
  backLabel = '뒤로 가기',
  overlay,
  children,
}: Props) {
  return (
    // SDK 57 은 Android 도 edge-to-edge 라 창이 줄지 않아서, 두 플랫폼 모두 padding 으로 비켜요.
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <Stage minFitRatio={KEYBOARD_MIN_FIT}>
        {/* 키보드가 떠 있으면 뒤로 가기 · 토스트가 잘려 보여서, 빈 곳을 누르면 키보드를 닫아요.
            (iOS 는 바깥을 눌러도 닫히지 않고, 나이 칸 number-pad 는 리턴 키가 없어요) */}
        <Pressable style={StyleSheet.absoluteFill} onPress={Keyboard.dismiss} accessible={false} />
        <View style={styles.center} pointerEvents="box-none">
          <Animated.View
            entering={FadeInDown.duration(DURATION.modal).withInitialValues({
              transform: [{ translateY: 12 }],
            })}
          >
            <Panel style={styles.card}>
              <View style={styles.header}>{header}</View>
              {children}
            </Panel>
          </Animated.View>
        </View>
        {onBack ? (
          <GlassIconButton
            icon="chevronLeft"
            label={backLabel}
            onPress={onBack}
            style={styles.back}
          />
        ) : null}
        {overlay}
      </Stage>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  card: { width: 340, paddingHorizontal: 25, paddingTop: 18, paddingBottom: 20, gap: 8 },
  header: { alignItems: 'center', marginBottom: 2 },
  back: { position: 'absolute', top: SCREEN.topBarY, left: SCREEN.safeX },
});
