import { fetch } from 'expo/fetch';

import { API_URL, ApiError, authHeaders, notifyUnauthorized, toApiError } from '@/lib/api-client';

export type SseMessage = { event: string; data: unknown };

// 이만큼 아무것도(:heartbeat 포함) 오지 않으면 연결이 조용히 끊긴 것으로 봐요.
// Android 의 expo/fetch 는 OkHttp readTimeout 0 이라, 와이파이 ↔ LTE 전환 때 read() 가 끝나지 않아요.
export const SSE_IDLE_TIMEOUT_MS = 30_000;

const TIMEOUT_MESSAGE = '동화 서버가 응답하지 않아요. 다시 시도해 주세요';
const NETWORK_MESSAGE = '서버에 연결할 수 없어요';

// "event: <이름>\ndata: <JSON>" 한 덩어리를 읽어요. 빈 줄 · 주석(:heartbeat)은 건너뛰어요.
function parseBlock(block: string): SseMessage | null {
  let event = 'message';
  const dataLines: string[] = [];
  for (const line of block.split(/\r?\n/)) {
    if (!line || line.startsWith(':')) continue;
    const idx = line.indexOf(':');
    const field = idx === -1 ? line : line.slice(0, idx);
    const value = idx === -1 ? '' : line.slice(idx + 1).replace(/^ /, '');
    if (field === 'event') event = value;
    else if (field === 'data') dataLines.push(value);
  }
  if (!dataLines.length) return null;
  const raw = dataLines.join('\n');
  try {
    return { event, data: JSON.parse(raw) };
  } catch {
    return { event, data: raw };
  }
}

type StreamOptions = {
  body: unknown;
  signal?: AbortSignal;
  onMessage: (message: SseMessage) => void;
};

// POST + Authorization 헤더가 필요해서 EventSource(GET 전용) 대신 fetch 스트림을 직접 읽어요.
// RN 기본 fetch 는 본문을 스트림으로 주지 않아 expo/fetch 를 써요.
// 스트림이 끝나면 resolve, 연결 · HTTP 오류 · 무응답이면 ApiError 로 reject 해요.
// 부른 쪽이 취소하면 받은 오류를 그대로 던지니, 부른 쪽은 오류 이름 대신 자기 signal 로 취소인지 판단해요.
export async function streamSse(path: string, { body, signal, onMessage }: StreamOptions) {
  // 부른 쪽의 취소와 무응답 타임아웃을 하나로 묶어요.
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener('abort', onAbort);

  let timedOut = false;
  let cancelReader: (() => void) | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  // 무엇이든 받으면 타이머를 다시 맞춰요.
  const touch = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timedOut = true;
      cancelReader?.();
      controller.abort();
    }, SSE_IDLE_TIMEOUT_MS);
  };

  // 취소 · 타임아웃 · 그 밖의 네트워크 오류를 나눠요.
  const fail = (e: unknown): never => {
    if (signal?.aborted) throw e;
    if (timedOut) throw new ApiError(0, 'TIMEOUT', TIMEOUT_MESSAGE);
    if (e instanceof ApiError) throw e;
    throw new ApiError(0, 'NETWORK', NETWORK_MESSAGE);
  };

  try {
    touch();
    const headers = await authHeaders({
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    });

    let res;
    try {
      res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        signal: controller.signal,
        headers,
        body: JSON.stringify(body),
      });
    } catch (e) {
      return fail(e);
    }

    if (res.status === 401 && 'Authorization' in headers) notifyUnauthorized();
    if (!res.ok) throw await toApiError(res, '동화 만들기를 시작하지 못했어요');
    if (!res.body) throw new ApiError(res.status, 'NO_STREAM', '동화 만들기를 시작하지 못했어요');

    const reader = res.body.getReader();
    cancelReader = () => {
      reader.cancel().catch(() => undefined);
    };
    const decoder = new TextDecoder();
    let buffer = '';

    for (;;) {
      let chunk;
      try {
        chunk = await reader.read();
      } catch (e) {
        return fail(e);
      }
      if (timedOut || signal?.aborted) return fail(null);
      if (chunk.done) break;
      touch();
      buffer += decoder.decode(chunk.value, { stream: true });
      let sep = buffer.search(/\r?\n\r?\n/);
      while (sep !== -1) {
        const message = parseBlock(buffer.slice(0, sep));
        buffer = buffer.slice(sep).replace(/^\r?\n\r?\n/, '');
        if (message) onMessage(message);
        sep = buffer.search(/\r?\n\r?\n/);
      }
    }
    const tail = parseBlock(buffer);
    if (tail) onMessage(tail);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}
