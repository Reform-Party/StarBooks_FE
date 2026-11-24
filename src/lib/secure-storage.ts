import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// 로그인 토큰처럼 기기에 남겨 둘 작은 값을 저장해요.
// 네이티브(iOS · Android)는 expo-secure-store(키체인 · Keystore)를 써요.
// expo-secure-store 는 웹 구현이 없어서, 웹은 localStorage 를 써요.
// 웹 localStorage 는 보안 저장소가 아니에요. 웹은 개발 · QA 때 화면을 확인하는 용도로만 써요.
const isWeb = Platform.OS === 'web';

export async function getItem(key: string): Promise<string | null> {
  if (isWeb) return globalThis.localStorage?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) globalThis.localStorage?.setItem(key, value);
  else await SecureStore.setItemAsync(key, value);
}

export async function removeItem(key: string): Promise<void> {
  if (isWeb) globalThis.localStorage?.removeItem(key);
  else await SecureStore.deleteItemAsync(key);
}
