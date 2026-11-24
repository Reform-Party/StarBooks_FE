const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
let replies = [],
  calls = [],
  signouts = 0,
  token = 'session-a';
const client = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('src/lib/api-client.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  {
    exports: client,
    require: () => ({ getItemAsync: async () => token }),
    __DEV__: false,
    process: { env: { EXPO_PUBLIC_API_URL: 'https://test.invalid/api' } },
    setTimeout,
    clearTimeout,
    AbortController,
    FormData,
    fetch: async (url, options) => {
      calls.push({ url, options });
      const reply = replies.shift();
      assert.ok(reply, 'unexpected request');
      if (reply.newToken) token = reply.newToken;
      if (reply.network) throw new Error('offline');
      return new Response(
        JSON.stringify({
          isSuccess: reply.status === 200,
          code: reply.status === 401 ? 'GLOBAL_401' : 'OK',
          message: 'server message',
          data: null,
        }),
        { status: reply.status },
      );
    },
  },
);
client.setUnauthorizedHandler(() => signouts++);
async function check(responses, expectedSignouts, path = '/api/fairytales/2') {
  replies = responses;
  calls = [];
  signouts = 0;
  token = 'session-a';
  await assert.rejects(
    client.request(path, { verifySessionOnUnauthorized: true }),
    (error) => error.status === 401 && error.code === 'GLOBAL_401',
  );
  assert.equal(signouts, expectedSignouts);
  assert.equal(replies.length, 0);
  assert.equal(calls[0].options.headers.Authorization, 'Bearer session-a');
}
(async () => {
  await check([{ status: 401 }, { status: 200 }], 0, '/api/fairytales/7');
  assert.equal(calls[0].url, 'https://test.invalid/api/api/fairytales/7');
  assert.equal(calls[1].options.headers.Authorization, calls[0].options.headers.Authorization);
  assert.equal(calls.length, 2, 'detail denial only probes profile, never retries without auth');
  await check([{ status: 401 }, { status: 200 }], 0);
  assert.equal(calls[1].url, 'https://test.invalid/api/api/users/profile');
  await check([{ status: 401 }, { status: 401 }], 1);
  await check([{ status: 401 }, { status: 503 }], 0);
  await check([{ status: 401 }, { network: true }], 0);
  await check([{ status: 401, newToken: 'session-b' }], 0);
  await check([{ status: 401 }, { status: 200 }], 0, '/api/users/voice/42/check');
  replies = [{ status: 404 }];
  calls = [];
  signouts = 0;
  await assert.rejects(
    client.request('/api/fairytales/2', { verifySessionOnUnauthorized: true }),
    (error) => error.status === 404,
  );
  assert.equal(calls.length, 1);
  assert.equal(signouts, 0);
  console.info(
    'PASS: reader/voice denial stays an error; profile confirms expiry; stale session and network are preserved',
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
