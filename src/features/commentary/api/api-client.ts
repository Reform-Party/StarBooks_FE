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

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : null),
      ...init.headers,
    },
  });
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok || (isEnvelope(body) && !body.isSuccess)) {
    const env = isEnvelope(body) ? body : null;
    throw new ApiError(
      res.status,
      env?.code ?? `HTTP_${res.status}`,
      env?.message ?? res.statusText,
    );
  }
  return (body as ApiEnvelope<T>).data;
}
