import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { SKY } from '@/constants/colors';
import { APP_FONTS } from '@/constants/fonts';
import { useAuthStore } from '@/features/auth/store/auth-store';
import BackgroundMusic from '@/features/sound/components/background-music';
import { queryClient } from '@/lib/query-client';

SplashScreen.preventAutoHideAsync();

// 앱은 밤하늘 한 가지 테마만 써요. 화면이 바뀌는 사이에도 흰 바탕이 비치지 않게 맞춰요.
const NAV_THEME = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: SKY.deep },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(APP_FONTS);
  const status = useAuthStore((s) => s.status);
  const restore = useAuthStore((s) => s.restore);

  useEffect(() => {
    restore();
  }, [restore]);

  // 글꼴과 로그인 상태가 준비될 때까지 스플래시를 보여 줘요.
  const ready = (fontsLoaded || fontError != null) && status !== 'loading';

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  // 막힌 경로로 들어오면 지금 상태의 첫 화면으로 보내요.
  const home = status === 'offline' ? '/offline' : status === 'guest' ? '/login' : '/';

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={NAV_THEME}>
        <StatusBar style="light" hidden />
        <BackgroundMusic />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          {/* 로그인 전에는 (auth), 로그인하면 (app) 만 열려요. 상태가 바뀌면 알아서 넘어가요.
              막힌 경로로 들어오면 redirectTo 로 보내요. SDK 58 의 기본 fallback 은 index 가 없는 그룹(`/(auth)`)을
              가리켜서 Unmatched Route 가 떠요. */}
          <Stack.Protected guard={status === 'guest'} redirectTo={home}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
          <Stack.Protected guard={status === 'authed'} redirectTo={home}>
            <Stack.Screen name="(app)" />
          </Stack.Protected>
          {/* 오프라인으로 켜면 로그인 · 메인 대신 저장한 동화 책장만 열려요. */}
          <Stack.Protected guard={status === 'offline'} redirectTo={home}>
            <Stack.Screen name="(offline)" />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
