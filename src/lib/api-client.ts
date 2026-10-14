import * as SecureStore from 'expo-secure-store';

// 관계도 게임(commentary)과 같은 키를 써서 로그인 토큰을 함께 써요.
const ACCESS_TOKEN_KEY = 'accessToken';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export const getAccessToken = () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

export async function setAccessToken(token: string | null) {
  if (token) await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}

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

export const isAbortError = (e: unknown) => e instanceof Error && e.name === 'AbortError';

// 서버 응답 봉투 { isSuccess, code, message, data } — 봉투 없이 오는 응답(목 서버)도 받아요.
type Envelope<T> = { isSuccess: boolean; code: string; message: string; data: T };

const isEnvelope = (v: unknown): v is Envelope<unknown> =>
  typeof v === 'object' && v !== null && 'isSuccess' in v && 'code' in v;

const messageOf = (v: unknown) =>
  typeof v === 'object' && v !== null && 'message' in v && typeof v.message === 'string'
    ? v.message
    : null;

export async function authHeaders(extra: Record<string, string> = {}) {
  const token = await getAccessToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

// 실패 응답을 ApiError 로 바꿔요. (SSE 처럼 본문을 직접 읽는 곳에서도 써요)
export async function toApiError(
  res: { status: number; json: () => Promise<unknown> },
  fallback: string,
) {
  const body: unknown = await res.json().catch(() => null);
  const env = isEnvelope(body) ? body : null;
  return new ApiError(res.status, env?.code ?? `HTTP_${res.status}`, messageOf(body) ?? fallback);
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
};

export async function request<T>(
  path: string,
  { method = 'GET', body, signal }: RequestOptions = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      signal,
      headers: await authHeaders(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    if (isAbortError(e)) throw e;
    throw new ApiError(0, 'NETWORK', '서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요');
  }

  if (!res.ok) throw await toApiError(res, '요청을 처리하지 못했어요');

  const data: unknown = await res.json().catch(() => null);
  if (!isEnvelope(data)) return data as T;
  if (!data.isSuccess) throw new ApiError(res.status, data.code, data.message);
  return data.data as T;
}
