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
export async function toApiError(res: Response, fallback: string) {
  const body: unknown = await res.json().catch(() => null);
  const env = isEnvelope(body) ? body : null;
  return new ApiError(res.status, env?.code ?? `HTTP_${res.status}`, messageOf(body) ?? fallback);
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  // 화면을 떠나거나 쿼리 키가 바뀌면 TanStack Query 가 넘겨주는 signal 로 요청을 취소해요.
  signal?: AbortSignal;
  // 응답이 이 시간 안에 오지 않으면 TIMEOUT 으로 끊어요. 0 이면 끊지 않아요 (SSE 처럼 오래 여는 요청).
  timeoutMs?: number;
  // 본문이 없는 게 정상인 API(204 등)만 true 로 둬요. 기본은 data 가 비면 EMPTY 로 알려요.
  allowEmpty?: boolean;
};

const DEFAULT_TIMEOUT_MS = 10_000;

export async function request<T>(
  path: string,
  {
    method = 'GET',
    body,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    allowEmpty = false,
  }: RequestOptions = {},
): Promise<T> {
  // 바깥 취소(signal)와 타임아웃을 하나의 AbortController 로 모으되, 어느 쪽인지는 구분해요.
  // 화면을 떠나 취소된 요청이 "응답이 너무 늦어요" 로 보이면 안 되니까요.
  const abort = new AbortController();
  let timedOut = false;
  const timer =
    timeoutMs > 0
      ? setTimeout(() => {
          timedOut = true;
          abort.abort();
        }, timeoutMs)
      : undefined;
  const forward = () => abort.abort();
  if (signal?.aborted) abort.abort();
  signal?.addEventListener('abort', forward);

  try {
    let res: Response;
    try {
      res = await fetch(`${API_URL}${path}`, {
        method,
        signal: abort.signal,
        headers: await authHeaders(
          body === undefined ? {} : { 'Content-Type': 'application/json' },
        ),
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (e) {
      if (isAbortError(e)) throw e;
      throw new ApiError(0, 'NETWORK', '서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요');
    }

    if (!res.ok) throw await toApiError(res, '요청을 처리하지 못했어요');

    const json: unknown = await res.json().catch(() => null);
    // 봉투 없이 오는 응답(목 서버)도 받아요.
    let value: unknown = json;
    if (isEnvelope(json)) {
      if (!json.isSuccess) throw new ApiError(res.status, json.code, json.message);
      value = json.data;
    }
    if (value == null && !allowEmpty) throw new ApiError(res.status, 'EMPTY', '응답이 비어 있어요');
    return value as T;
  } catch (e) {
    if (timedOut)
      throw new ApiError(0, 'TIMEOUT', '응답이 너무 늦어요. 잠시 후 다시 시도해 주세요');
    throw e;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', forward);
  }
}
