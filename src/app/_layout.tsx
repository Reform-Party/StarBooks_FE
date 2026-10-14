import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { SKY } from '@/constants/colors';
import { APP_FONTS } from '@/constants/fonts';
import { useAuthStore } from '@/features/auth/store/auth-store';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

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

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={NAV_THEME}>
        <StatusBar style="light" hidden />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          {/* 로그인 전에는 (auth), 로그인하면 (app) 만 열려요. 상태가 바뀌면 알아서 넘어가요. */}
          <Stack.Protected guard={status === 'guest'}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
          <Stack.Protected guard={status === 'authed'}>
            <Stack.Screen name="(app)" />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
