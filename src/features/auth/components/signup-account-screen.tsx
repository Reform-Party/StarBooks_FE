import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, type TextInputInstance } from 'react-native';

import AlertModal from '@/components/ui/alert-modal';
import JellyButton from '@/components/ui/jelly-button';
import AuthScreen from '@/features/auth/components/auth-screen';
import StepTitle from '@/features/auth/components/step-title';
import TextField from '@/features/auth/components/text-field';
import { useSignupDraftStore } from '@/features/auth/store/signup-draft-store';

type Alert = { title: string; message: string };

// 기본 · 회원가입 1 / 2 (Figma design): 아이디 · 비밀번호 · 비밀번호 확인 → 다음
//  2 다음: 빈 칸 · 비밀번호 일치를 보고, 통과하면 아이 정보 / 아니면 알림창
export default function SignupAccountScreen() {
  const draft = useSignupDraftStore((s) => s.account);
  const setAccount = useSignupDraftStore((s) => s.setAccount);
  const clearDraft = useSignupDraftStore((s) => s.clear);
  const [userId, setUserId] = useState(draft?.userId ?? '');
  const [password, setPassword] = useState(draft?.password ?? '');
  const [confirm, setConfirm] = useState(draft?.password ?? '');
  const [alert, setAlert] = useState<Alert | null>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);

  // 가입을 그만두면 적어 둔 비밀번호를 메모리에서 지워요.
  // 버튼 · Android 뒤로 가기 · 스와이프 모두 이 화면이 스택에서 빠질(언마운트될) 때 한 번에 처리해요.
  // 아이 정보 화면으로 넘어가도 이 화면은 스택에 남아 있어서 초안이 유지돼요.
  // 그래서 2/2 로는 push 로만 넘어가야 해요. (replace 나 Stack 의 activityEnabled 를 쓰면 일찍 지워져요)
  useEffect(() => () => clearDraft(), [clearDraft]);

  const handleNext = () => {
    if (!userId.trim() || !password || !confirm) {
      setAlert({ title: '빈 칸이 있어요', message: '모든 칸을 채워 주세요' });
      return;
    }
    if (password !== confirm) {
      setAlert({ title: '비밀번호가 달라요', message: '비밀번호 확인 칸을 다시 적어 주세요' });
      return;
    }
    setAccount({ userId: userId.trim(), password });
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
