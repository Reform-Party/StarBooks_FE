import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, type TextInput, View } from 'react-native';

import BrandTitle from '@/components/ui/brand-title';
import JellyButton from '@/components/ui/jelly-button';
import Toast from '@/components/ui/toast';
import { INK, STAR } from '@/constants/colors';
import { FONT } from '@/constants/fonts';
import { PORTRAIT_SCREEN } from '@/constants/layout';
import { TYPE } from '@/constants/typography';
import AuthScreen from '@/features/auth/components/auth-screen';
import SocialLoginRow from '@/features/auth/components/social-login-row';
import TextField from '@/features/auth/components/text-field';
import { useLogin } from '@/features/auth/hooks/use-auth-api';
import { useToast } from '@/hooks/use-toast';

type Props = {
  // 가입을 마치고 돌아오면 가입한 이메일을 채워 둬요.
  initialEmail?: string;
};

// 기본 · 로그인 (Figma design · 세로 화면)
//  1 입력칸 포커스: 노란 테두리 + 은은한 글로우
//  3 로그인: 이메일 · 비밀번호를 모두 채워야 활성 · 실패하면 비밀번호 칸 아래 오류 문구 + 입력칸 흔들림 0.3s
//  4 회원가입 → 회원가입 1 / 2
export default function LoginScreen({ initialEmail = '' }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [failCount, setFailCount] = useState(0);
  const passwordRef = useRef<TextInput>(null);
  const { toast, show } = useToast(2400);
  const login = useLogin();

  const canSubmit = !!email.trim() && !!password && !login.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    login.mutate({ email: email.trim(), password }, { onError: () => setFailCount((n) => n + 1) });
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (login.isError) login.reset();
  };

  return (
    <AuthScreen
      hero={
        <View style={styles.hero}>
          <BrandTitle size={48} />
          <Text style={[TYPE.body, styles.sub]}>별빛 동화를 만나러 가요</Text>
        </View>
      }
      overlay={<Toast toast={toast} top={PORTRAIT_SCREEN.topBarY} />}
    >
      <TextField
        label="이메일"
        placeholder="haneul07@star.com"
        value={email}
        onChangeText={(v) => setEmail(v.trim())}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
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

      <SocialLoginRow
        onPress={(name) => show(`${name} 로그인은 준비 중이에요. 이메일로 로그인해 주세요`)}
      />

      <View style={styles.signupRow}>
        <Text style={styles.signupText}>처음 왔나요?</Text>
        <Pressable accessibilityRole="link" hitSlop={10} onPress={() => router.push('/signup')}>
          <Text style={styles.signupLink}>회원가입</Text>
        </Pressable>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 8 },
  sub: { color: INK[2] },
  submit: { marginTop: 4 },
  signupRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  signupText: { ...TYPE.caption, color: INK[3] },
  signupLink: { ...TYPE.caption, fontFamily: FONT.sansBold, color: STAR.mint.c300 },
});
