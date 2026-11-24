import * as SecureStore from 'expo-secure-store';

// 관계도 게임(commentary)과 같은 키를 써서 로그인 토큰을 함께 써요.
const ACCESS_TOKEN_KEY = 'accessToken';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

// .env 가 빠지면 상대 경로로 요청해서 "연결할 수 없어요" 만 보여요. 개발 중에는 바로 알려요.
if (__DEV__ && !API_URL) console.warn('EXPO_PUBLIC_API_URL 이 비어 있어요. .env 를 확인해 주세요');

// 서버가 응답하지 않을 때 기다리는 시간. RN Android(OkHttp)는 기본 타임아웃이 없어요.
export const REQUEST_TIMEOUT_MS = 10_000;

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

// 토큰을 보낸 요청이 401 을 받으면 부르는 핸들러. 순환 import 를 피하려고 auth-store 가 등록해요.
let handleUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  handleUnauthorized = fn;
};
export const notifyUnauthorized = () => handleUnauthorized?.();

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
  const headers: Record<string, string> = token
    ? { ...extra, Authorization: `Bearer ${token}` }
    : extra;
  return headers;
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
  // FormData 는 그대로 보내고, 나머지는 JSON 으로 바꿔 보내요.
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
  onStatus?: (status: number) => void;
  verifySessionOnUnauthorized?: boolean;
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { data } = await requestWithHeaders<T>(path, options);
  return data;
}

export async function requestWithHeaders<T>(
  path: string,
  {
    method = 'GET',
    body,
    signal,
    timeoutMs = REQUEST_TIMEOUT_MS,
    onStatus,
    verifySessionOnUnauthorized = false,
  }: RequestOptions = {},
): Promise<{ data: T; headers: Headers }> {
  // 부른 쪽의 취소와 타임아웃을 하나의 signal 로 묶어요.
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener('abort', onAbort);

  try {
    // FormData 의 Content-Type 은 fetch 가 boundary 와 함께 채워요.
    const isForm = body instanceof FormData;
    const headers = await authHeaders(
      body === undefined || isForm ? {} : { 'Content-Type': 'application/json' },
    );

    let res: Response;
    try {
      res = await fetch(`${API_URL}${path}`, {
        method,
        signal: controller.signal,
        headers,
        body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      });
    } catch (e) {
      if (signal?.aborted) throw e;
      if (timedOut) {
        throw new ApiError(0, 'TIMEOUT', '서버가 응답하지 않아요. 잠시 후 다시 시도해 주세요');
      }
      throw new ApiError(0, 'NETWORK', '서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요');
    }

    if (res.status === 401 && 'Authorization' in headers) {
      // 이전 로그인에서 늦게 돌아온 응답이 새 세션을 지우지 않게 해요.
      const current = await authHeaders();
      if (headers.Authorization === current.Authorization) {
        if (verifySessionOnUnauthorized) {
          try {
            await request('/api/users/profile', { signal: controller.signal });
          } catch (error) {
            // 프로필의 실제 401만 공용 처리에서 로그아웃시켜요.
            // 네트워크/5xx로는 세션 만료를 판단하지 않아요.
            if (signal?.aborted) throw error;
          }
        } else {
          notifyUnauthorized();
        }
      }
      const error = await toApiError(res, '요청이 거절됐어요');
      throw new ApiError(
        error.status,
        error.code,
        `${error.message} (HTTP 401 · ${method} ${path.split('?')[0]})`,
      );
    }
    if (!res.ok) throw await toApiError(res, '요청을 처리하지 못했어요');
    onStatus?.(res.status);

    // 본문이 없는 응답(204 등)만 허용하고, 2xx 인데 JSON 이 아니면 오류로 봐요.
    let text = '';
    if (res.status !== 204) {
      try {
        text = await res.text();
      } catch (e) {
        if (signal?.aborted) throw e;
        throw new ApiError(0, timedOut ? 'TIMEOUT' : 'NETWORK', '서버 응답을 받지 못했어요');
      }
    }
    if (!text) return { data: undefined as T, headers: res.headers };
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiError(res.status, 'BAD_RESPONSE', '서버 응답을 읽지 못했어요');
    }
    if (!isEnvelope(data)) return { data: data as T, headers: res.headers };
    if (!data.isSuccess) throw new ApiError(res.status, data.code, data.message);
    return { data: data.data as T, headers: res.headers };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}
