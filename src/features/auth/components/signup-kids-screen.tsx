import { router } from 'expo-router';
import { useState } from 'react';
import { Keyboard, StyleSheet } from 'react-native';

import AlertModal from '@/components/ui/alert-modal';
import JellyButton from '@/components/ui/jelly-button';
import { SIGNED_UP_WITHOUT_SESSION } from '@/features/auth/api/auth-api';
import type { Gender } from '@/features/auth/api/types';
import AuthScreen from '@/features/auth/components/auth-screen';
import Segmented from '@/features/auth/components/segmented';
import StepTitle from '@/features/auth/components/step-title';
import TextField from '@/features/auth/components/text-field';
import { useSignup } from '@/features/auth/hooks/use-auth-api';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { useSignupDraftStore } from '@/features/auth/store/signup-draft-store';
import { ApiError } from '@/lib/api-client';

const GENDERS = [
  { id: 'M', label: '남자' },
  { id: 'W', label: '여자' },
] as const;

type Alert = { title: string; message: string };

type Props = {
  account: { userId: string; password: string };
};

// 기본 · 아이 정보 2 / 2 (Figma design): 닉네임 · 나이 · 성별(고른 칸 민트) → 가입 완료
//  2 가입 완료: 가입하면 바로 로그인돼요. 환영 알림 → 시작하기 · 빈 칸이 있으면 알림
export default function SignupKidsScreen({ account }: Props) {
  const signIn = useAuthStore((s) => s.signIn);
  const clearDraft = useSignupDraftStore((s) => s.clear);
  // 가입은 됐는데 바로 로그인하지 못한 경우 (로그인 화면으로 보내요)
  const [needsLogin, setNeedsLogin] = useState(false);
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
    // 알림창이 키보드에 가리지 않게 닫아요.
    Keyboard.dismiss();
    signup.mutate(
      { ...account, nickname: nickname.trim(), age: Number(age), gender },
      {
        onError: (e) => {
          if (e instanceof ApiError && e.code === SIGNED_UP_WITHOUT_SESSION) setNeedsLogin(true);
          else setAlert({ title: '가입하지 못했어요', message: e.message });
        },
      },
    );
  };

  // 로그인 상태로 바꾸면 루트 레이아웃의 가드가 메인 화면으로 보내요. (비밀번호 초안도 signIn 이 지워요)
  const handleDone = () => {
    if (signup.data) signIn(signup.data);
  };

  // 계정은 만들어졌으니 다시 가입하지 않게, 아이디를 채운 로그인 화면으로 보내요.
  const handleGoLogin = () => {
    clearDraft();
    router.dismissTo({ pathname: '/login', params: { userId: account.userId } });
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
            actionLabel="시작하기"
            onAction={handleDone}
          />
          <AlertModal
            visible={needsLogin}
            tone="mint"
            title="가입을 마쳤어요!"
            message="로그인하면 바로 시작할 수 있어요"
            actionLabel="로그인하러 가기"
            onAction={handleGoLogin}
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
