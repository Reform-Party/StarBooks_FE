import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, type TextInput } from 'react-native';

import AlertModal from '@/components/ui/alert-modal';
import JellyButton from '@/components/ui/jelly-button';
import AuthScreen from '@/features/auth/components/auth-screen';
import StepTitle from '@/features/auth/components/step-title';
import TextField from '@/features/auth/components/text-field';
import { useSignupDraftStore } from '@/features/auth/store/signup-draft-store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Alert = { title: string; message: string };

// 기본 · 회원가입 1 / 2 (Figma design): 이메일 · 비밀번호 · 비밀번호 확인 → 다음
//  2 다음: 빈 칸 · 이메일 형식 · 비밀번호 일치를 보고, 통과하면 아이 정보 / 아니면 알림창
export default function SignupAccountScreen() {
  const draft = useSignupDraftStore((s) => s.account);
  const setAccount = useSignupDraftStore((s) => s.setAccount);
  const [email, setEmail] = useState(draft?.email ?? '');
  const [password, setPassword] = useState(draft?.password ?? '');
  const [confirm, setConfirm] = useState(draft?.password ?? '');
  const [alert, setAlert] = useState<Alert | null>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const handleNext = () => {
    if (!email.trim() || !password || !confirm) {
      setAlert({ title: '빈 칸이 있어요', message: '모든 칸을 채워 주세요' });
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setAlert({ title: '이메일을 확인해 주세요', message: 'star@example.com 처럼 적어 주세요' });
      return;
    }
    if (password !== confirm) {
      setAlert({ title: '비밀번호가 달라요', message: '비밀번호 확인 칸을 다시 적어 주세요' });
      return;
    }
    setAccount({ email: email.trim(), password });
    router.push('/signup/kids');
  };

  return (
    <AuthScreen
      header={<StepTitle title="회원가입" step="1 / 2" />}
      onBack={() => router.back()}
      backLabel="로그인으로 돌아가기"
      overlay={
        <AlertModal
          visible={!!alert}
          tone="pink"
          title={alert?.title ?? ''}
          message={alert?.message}
          onAction={() => setAlert(null)}
        />
      }
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
      />
      <TextField
        ref={passwordRef}
        label="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => confirmRef.current?.focus()}
      />
      <TextField
        ref={confirmRef}
        label="비밀번호 확인"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={handleNext}
      />
      <JellyButton label="다음" onPress={handleNext} style={styles.submit} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  submit: { marginTop: 4 },
});
