import * as SecureStore from 'expo-secure-store';

import type { ApiEnvelope } from '@/features/commentary/api/types';

export const ACCESS_TOKEN_KEY = 'accessToken';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const isEnvelope = (v: unknown): v is ApiEnvelope<unknown> =>
  typeof v === 'object' && v !== null && 'code' in v && 'httpStatus' in v;

const TIMEOUT_MS = 10_000;

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  // 응답이 안 오면 버튼 · 트레이가 계속 막혀 있지 않게 10초 뒤 끊어요.
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${path}`, {
      ...init,
      signal: abort.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : null),
        ...init.headers,
      },
    });
  } catch {
    throw abort.signal.aborted
      ? new ApiError(0, 'TIMEOUT', '응답이 너무 늦어요.')
      : new ApiError(0, 'NETWORK', '네트워크에 연결할 수 없어요.');
  } finally {
    clearTimeout(timer);
  }
  const body: unknown = await res.json().catch(() => null);
  if (!isEnvelope(body)) {
    // 빈 응답 · JSON 이 아닌 응답 · 약속한 모양이 아닌 응답
    throw new ApiError(
      res.status,
      `HTTP_${res.status}`,
      res.statusText || '알 수 없는 응답이에요.',
    );
  }
  if (!res.ok || !body.isSuccess) throw new ApiError(res.status, body.code, body.message);
  return body.data as T;
}
