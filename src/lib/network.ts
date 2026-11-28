import * as Network from 'expo-network';

import { ApiError } from '@/lib/api-client';

// 비행기 모드처럼 연결 자체가 없을 때만 오프라인으로 봐요.
// (isInternetReachable 은 Android 에서 서버에 닿는 망도 false 로 줄 때가 있어 쓰지 않아요.
// 서버에 닿지 못하는 경우는 요청 실패 isNetworkError 로 판단해요)
export function useIsOnline() {
  return Network.useNetworkState().isConnected === true;
}

// 앱을 켤 때 한 번 확인해요. 확인하지 못하면 온라인으로 보고 요청을 보내요.
export async function checkOffline() {
  try {
    return (await Network.getNetworkStateAsync()).isConnected === false;
  } catch {
    return false;
  }
}

// 서버에 닿지 못한 실패예요. (4xx · 5xx 처럼 서버가 답한 실패는 아니에요)
export const isNetworkError = (e: unknown) =>
  e instanceof ApiError && (e.code === 'NETWORK' || e.code === 'TIMEOUT');
