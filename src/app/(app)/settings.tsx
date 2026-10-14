import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import GlassIconButton from '@/components/ui/glass-icon-button';
import JellyButton from '@/components/ui/jelly-button';
import Stage from '@/components/ui/stage';
import { INK } from '@/constants/colors';
import { SCREEN } from '@/constants/layout';
import { TYPE } from '@/constants/typography';
import { useAuthStore } from '@/features/auth/store/auth-store';

// 설정 화면(④ 준석 파트)이 들어오기 전까지 로그아웃만 할 수 있게 둔 자리예요.
export default function SettingsRoute() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  return (
    <Stage>
      <View style={styles.center}>
        <Text style={[TYPE.title, styles.title]}>설정</Text>
        <Text style={[TYPE.caption, styles.text]}>설정 화면은 준비 중이에요</Text>
        <JellyButton tone="glass" label={`${user?.nickname ?? ''} 로그아웃`} onPress={signOut} />
      </View>
      <GlassIconButton
        icon="home"
        label="메인으로"
        onPress={() => router.dismissTo('/')}
        style={styles.home}
      />
    </Stage>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  title: { color: INK[1] },
  text: { color: INK[3], marginBottom: 12 },
  home: { position: 'absolute', top: SCREEN.topBarY, left: SCREEN.homeButtonX },
});
