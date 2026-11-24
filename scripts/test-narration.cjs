const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

let replies = [];
let calls = [];
function load(path, dependencies) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    {
      exports,
      require: (name) => dependencies[name],
      __DEV__: false,
      process: { env: { EXPO_PUBLIC_API_URL: 'https://test.invalid' } },
      setTimeout,
      clearTimeout,
      AbortController,
      FormData,
      fetch: async (url, options) => {
        calls.push({ url, ...options });
        const reply = replies.shift();
        assert.ok(reply, 'unexpected request');
        return new Response(reply.body === undefined ? null : JSON.stringify(reply.body), {
          status: reply.status,
        });
      },
    },
  );
  return exports;
}
const client = load('src/lib/api-client.ts', {
  'expo-secure-store': { getItemAsync: async () => 'test-token' },
});
const api = load('src/features/story/api/narration-api.ts', {
  '@/lib/api-client': client,
  '@/features/story/api/story-api': { isNumericStoryId: (id) => /^[1-9]\d*$/.test(id) },
});
const page = { paragraphId: 42, page: 1, text: '동화', imageUrl: null };
(async () => {
  replies = [
    { status: 200 },
    {
      status: 200,
      body: {
        isSuccess: true,
        code: 'OK',
        data: { paragraphId: 42, ttsUrl: 'https://audio.invalid/42.mp3' },
      },
    },
  ];
  assert.equal((await api.fetchNarration(page)).ttsUrl, 'https://audio.invalid/42.mp3');
  assert.deepEqual(
    calls.map((call) => call.url),
    ['https://test.invalid/api/users/voice/42/check', 'https://test.invalid/api/users/voice/42'],
  );
  assert.equal(calls[0].headers.Authorization, 'Bearer test-token');
  calls = [];
  replies = [{ status: 204 }];
  assert.equal((await api.fetchNarration(page)).ttsUrl, null);
  assert.equal(calls.length, 1, 'missing narration must not fetch a file or generate');
  calls = [];
  replies = [
    { status: 200, body: { isSuccess: true, code: 'SUCCESS_200', httpStatus: 204, data: false } },
  ];
  assert.equal((await api.fetchNarration(page)).ttsUrl, null);
  assert.equal(calls.length, 1, 'data:false must not request a file even when HTTP is 200');
  replies = [{ status: 200 }, { status: 200, body: { paragraphId: 99, ttsUrl: 'wrong' } }];
  await assert.rejects(api.fetchNarration(page), /음성 파일/);
  replies = [{ status: 500, body: { message: 'server error' } }];
  await assert.rejects(api.fetchNarration(page), /server error/);
  calls = [];
  const supplied = { ...page, paragraphId: undefined, ttsUrl: 'https://audio.invalid/ready.mp3' };
  assert.equal((await api.fetchNarration(supplied)).ttsUrl, supplied.ttsUrl);
  assert.equal(calls.length, 0, 'detail audio URL must play without paragraph lookup');
  assert.equal(
    (await api.fetchNarration({ ...page, paragraphId: undefined })).paragraphId,
    undefined,
  );
  assert.equal(calls.length, 0, 'page number must never stand in for paragraph id');
  replies = [{ status: 202 }];
  assert.equal(typeof (await api.requestNarration('7')), 'number');
  assert.equal(calls[0].method, 'POST');
  assert.equal(calls[0].url, 'https://test.invalid/api/users/voice/7');
  await assert.rejects(api.requestNarration('bad'), /동화 번호/);
  console.info(
    'PASS: narration 200/204, authenticated lookup, mismatch, server error, missing ID, explicit generation',
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
