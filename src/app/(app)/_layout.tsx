import { Stack } from 'expo-router';

export const unstable_settings = { anchor: 'index' };

export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}
