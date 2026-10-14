import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import AlertModal from '@/components/ui/alert-modal';
import JellyButton from '@/components/ui/jelly-button';
import type { Gender } from '@/features/auth/api/types';
import AuthScreen from '@/features/auth/components/auth-screen';
import Segmented from '@/features/auth/components/segmented';
import StepTitle from '@/features/auth/components/step-title';
import TextField from '@/features/auth/components/text-field';
import { useSignup } from '@/features/auth/hooks/use-auth-api';
import { useSignupDraftStore } from '@/features/auth/store/signup-draft-store';

const GENDERS = [
  { id: 'M', label: '남자' },
  { id: 'W', label: '여자' },
] as const;

type Alert = { title: string; message: string };

type Props = {
  account: { email: string; password: string };
};

// 기본 · 아이 정보 2 / 2 (Figma design): 닉네임 · 나이 · 성별(고른 칸 민트) → 가입 완료
//  2 가입 완료: 가입 완료 알림 → 로그인 · 빈 칸이 있으면 알림
export default function SignupKidsScreen({ account }: Props) {
  const clearDraft = useSignupDraftStore((s) => s.clear);
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [alert, setAlert] = useState<Alert | null>(null);
  const signup = useSignup();

  const handleSubmit = () => {
    if (!nickname.trim() || !age || !gender) {
      setAlert({ title: '빈 칸이 있어요', message: '닉네임, 나이, 성별을 모두 골라 주세요' });
      return;
    }
    // 입력칸이 숫자 2자리까지만 받아서 0살만 막아요.
    if (Number(age) < 1) {
      setAlert({ title: '나이를 확인해 주세요', message: '1살 이상으로 적어 주세요' });
      return;
    }
    signup.mutate(
      { ...account, nickname: nickname.trim(), age: Number(age), gender },
      { onError: (e) => setAlert({ title: '가입하지 못했어요', message: e.message }) },
    );
  };

  const handleDone = () => {
    clearDraft();
    router.dismissTo({ pathname: '/login', params: { email: account.email } });
  };

  return (
    <AuthScreen
      header={<StepTitle title="아이 정보" step="2 / 2" />}
      onBack={() => router.back()}
      backLabel="이전 단계로"
      overlay={
        <>
          <AlertModal
            visible={!!alert}
            tone="pink"
            title={alert?.title ?? ''}
            message={alert?.message}
            onAction={() => setAlert(null)}
          />
          <AlertModal
            visible={signup.isSuccess}
            tone="mint"
            title="가입을 마쳤어요!"
            message={`${nickname.trim()}, 별나라 책방에 온 걸 환영해요`}
            actionLabel="로그인하러 가기"
            onAction={handleDone}
          />
        </>
      }
    >
      <TextField
        label="닉네임"
        placeholder="하늘"
        value={nickname}
        onChangeText={setNickname}
        returnKeyType="next"
      />
      <TextField
        label="나이"
        placeholder="7"
        value={age}
        onChangeText={(v) => setAge(v.replace(/\D/g, '').slice(0, 2))}
        keyboardType="number-pad"
        maxLength={2}
      />
      <Segmented label="성별" options={GENDERS} value={gender} onChange={setGender} />
      <JellyButton
        label={signup.isPending ? '가입하는 중…' : '가입 완료'}
        disabled={signup.isPending}
        onPress={handleSubmit}
        style={styles.submit}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  submit: { marginTop: 4 },
});
