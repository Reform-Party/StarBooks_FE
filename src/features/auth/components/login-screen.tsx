import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, type TextInputInstance, View } from 'react-native';

import BrandTitle from '@/components/ui/brand-title';
import ClickPressable from '@/components/ui/click-pressable';
import JellyButton from '@/components/ui/jelly-button';
import { INK, STAR } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { TYPE } from '@/constants/typography';
import AuthScreen from '@/features/auth/components/auth-screen';
import TextField from '@/features/auth/components/text-field';
import { useLogin } from '@/features/auth/hooks/use-auth-api';

type Props = {
  // 가입을 마치고 돌아오면 가입한 아이디를 채워 둬요.
  initialUserId?: string;
};

// 기본 · 로그인 (Figma design · 가로 화면)
//  1 입력칸 포커스: 노란 테두리 + 은은한 글로우
//  3 로그인: 아이디 · 비밀번호를 모두 채워야 활성 · 실패하면 비밀번호 칸 아래 오류 문구 + 입력칸 흔들림 0.3s
//  4 회원가입 → 회원가입 1 / 2
export default function LoginScreen({ initialUserId = '' }: Props) {
  const [userId, setUserId] = useState(initialUserId);
  const [password, setPassword] = useState('');
  const [failCount, setFailCount] = useState(0);
  const passwordRef = useRef<TextInputInstance>(null);
  const login = useLogin();

  const canSubmit = !!userId.trim() && !!password && !login.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    login.mutate(
      { userId: userId.trim(), password },
      { onError: () => setFailCount((n) => n + 1) },
    );
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (login.isError) login.reset();
  };

  return (
    <AuthScreen
      header={
        <View style={styles.hero}>
          <BrandTitle size={32} />
          <Text style={[TYPE.caption, styles.sub]}>별빛 동화를 만나러 가요</Text>
        </View>
      }
    >
      <TextField
        label="아이디"
        placeholder="haneul07"
        value={userId}
        onChangeText={(v) => setUserId(v.trim())}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        textContentType="username"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
        invalid={login.isError}
        shakeKey={failCount}
      />
      <TextField
        ref={passwordRef}
        label="비밀번호"
        value={password}
        onChangeText={handlePasswordChange}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
        error={login.error?.message}
        shakeKey={failCount}
      />
      <JellyButton
        label={login.isPending ? '로그인 중…' : '로그인'}
        disabled={!canSubmit}
        onPress={handleSubmit}
        style={styles.submit}
      />

      <View style={styles.signupRow}>
        <Text style={styles.signupText}>처음 왔나요?</Text>
        <ClickPressable
          accessibilityRole="link"
          hitSlop={10}
          onPress={() => router.push('/signup')}
        >
          <Text style={styles.signupLink}>회원가입</Text>
        </ClickPressable>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 2 },
  sub: { color: INK[2] },
  submit: { marginTop: 4 },
  signupRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  signupText: { ...TYPE.caption, color: INK[3] },
  signupLink: { ...TYPE.caption, fontFamily: FONT.sansBold, color: STAR.mint.c300 },
});
