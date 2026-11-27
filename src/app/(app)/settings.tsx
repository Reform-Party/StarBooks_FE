import { useAuthStore } from '@/features/auth/store/auth-store';
import SettingsScreen from '@/features/settings/components/settings-screen';

export default function SettingsRoute() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  // (app) 레이아웃 가드가 로그인 전에는 들어오지 못하게 해요. 로그아웃 직후 한 프레임만 비어 있어요.
  if (!user) return null;
  return <SettingsScreen user={user} onSignOut={() => void signOut()} />;
}
