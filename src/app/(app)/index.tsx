import { StyleSheet, Text, View } from 'react-native';

import BrandTitle from '@/components/ui/brand-title';
import JellyButton from '@/components/ui/jelly-button';
import Stage from '@/components/ui/stage';
import { INK } from '@/constants/colors';
import { TYPE } from '@/constants/typography';
import { useAuthStore } from '@/features/auth/store/auth-store';

// 메인 화면이 들어오기 전까지 로그인 확인용으로 두는 자리예요.
export default function MainRoute() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  return (
    <Stage>
      <View style={styles.center}>
        <BrandTitle size={44} />
        <Text style={[TYPE.body, styles.text]}>{user?.nickname} 님, 반가워요</Text>
        <JellyButton tone="glass" label="로그아웃" onPress={signOut} />
      </View>
    </Stage>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  text: { color: INK[2] },
});
