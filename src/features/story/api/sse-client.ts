import { fetch } from 'expo/fetch';

import { API_URL, ApiError, authHeaders, isAbortError, toApiError } from '@/lib/api-client';

export type SseMessage = { event: string; data: unknown };

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
// 스트림이 끝나면 resolve, 연결 · HTTP 오류면 reject 해요.
export async function streamSse(path: string, { body, signal, onMessage }: StreamOptions) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      signal,
      headers: await authHeaders({
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      }),
      body: JSON.stringify(body),
    });
  } catch (e) {
    if (isAbortError(e)) throw e;
    throw new ApiError(0, 'NETWORK', '서버에 연결할 수 없어요');
  }

  if (!res.ok) throw await toApiError(res, '동화 만들기를 시작하지 못했어요');
  if (!res.body) throw new ApiError(res.status, 'NO_STREAM', '동화 만들기를 시작하지 못했어요');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
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
}
