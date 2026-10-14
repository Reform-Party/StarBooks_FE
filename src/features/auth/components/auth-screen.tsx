import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import GlassIconButton from '@/components/ui/glass-icon-button';
import Panel from '@/components/ui/panel';
import Stage from '@/components/ui/stage';
import { PORTRAIT_SCREEN } from '@/constants/layout';
import { DURATION } from '@/constants/motion';

type Props = {
  // 패널 위에 놓는 제목 (로그인의 "별나라 책방")
  hero?: ReactNode;
  // 패널 안 맨 위 (회원가입의 "회원가입 1 / 2")
  header?: ReactNode;
  // 왼쪽 위 뒤로 가기 버튼
  onBack?: () => void;
  backLabel?: string;
  // 알림창 · 토스트처럼 화면 전체에 겹쳐 그릴 것
  overlay?: ReactNode;
  children: ReactNode;
};

// 로그인 · 회원가입 · 아이 정보 공통 틀 (세로 402 × 874 · 패널 폭 338)
// 패널은 아래에서 12pt 올라오며 나타나요. 키보드가 올라오면 캔버스가 그만큼 줄어 입력칸이 가리지 않아요.
export default function AuthScreen({
  hero,
  header,
  onBack,
  backLabel = '뒤로 가기',
  overlay,
  children,
}: Props) {
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stage orientation="portrait">
        <View style={styles.center}>
          {hero}
          <Animated.View
            entering={FadeInDown.duration(DURATION.modal).withInitialValues({
              transform: [{ translateY: 12 }],
            })}
          >
            <Panel style={styles.card}>
              {header ? <View style={styles.header}>{header}</View> : null}
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
  center: {
    position: 'absolute',
    top: 59,
    bottom: 34,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  card: { width: 338, paddingHorizontal: 24, paddingTop: 22, paddingBottom: 18, gap: 12 },
  header: { alignItems: 'center', marginBottom: 2 },
  back: { position: 'absolute', top: PORTRAIT_SCREEN.topBarY, left: PORTRAIT_SCREEN.safeX },
});
