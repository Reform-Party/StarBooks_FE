const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { QueryClient, QueryObserver } = require('@tanstack/react-query');

// 네이티브 렌더링 대신 실제 QueryObserver로 요청 중복·캐시·재시도 경계를 검증해요.
async function scenario({ ready = false, reject = false } = {}) {
  const client = new QueryClient();
  const observers = [];
  const subscriptions = [];
  let index = 0;
  let posts = 0;
  let focused = true;
  let active = true;
  let fail = reject;
  const story = { id: '7', pages: [{ page: 1, ttsUrl: ready ? 'voice.mp3' : null }] };
  let detail = story;
  const module = { exports: {} };
  const mocks = {
    '@tanstack/react-query': {
      useQueryClient: () => client,
      useQuery: (options) => {
        const slot = index++;
        if (!observers[slot]) {
          observers[slot] = new QueryObserver(client, options);
          subscriptions[slot] = observers[slot].subscribe(() => {});
        } else observers[slot].setOptions(options);
        return observers[slot].getCurrentResult();
      },
    },
    'expo-router': { useIsFocused: () => focused },
    react: { useSyncExternalStore: () => active },
    'react-native': { AppState: {} },
    '@/features/story/api/narration-api': {
      requestNarration: async () => {
        posts++;
        if (fail) throw new Error('생성 실패');
        return Date.now();
      },
    },
    '@/features/story/api/story-api': { fetchStory: async () => detail },
  };
  const source = fs.readFileSync('src/features/story/hooks/use-story-narration.ts', 'utf8');
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    { module, exports: module.exports, require: (name) => mocks[name], Date },
  );
  const render = () => {
    index = 0;
    return module.exports.useStoryNarration('7', client.getQueryData(['story', '7']) ?? story);
  };
  const tick = () => new Promise((resolve) => setImmediate(resolve));
  try {
    render();
    await tick();
    render();
    await tick();
    let result = render();
    assert.equal(posts, ready ? 0 : 1);
    if (ready) return;
    focused = false;
    render();
    focused = true;
    render();
    await tick();
    assert.equal(posts, 1, '화면 복귀 시 POST 중복 금지');
    subscriptions.forEach((unsubscribe) => unsubscribe());
    observers.length = 0;
    subscriptions.length = 0;
    render();
    await tick();
    assert.equal(posts, 1, '화면 재진입 시 POST 중복 금지');
    active = false;
    render();
    assert.equal(observers[1].options.enabled, false, '백그라운드 폴링 중단');
    active = true;
    result = render();
    if (reject) {
      assert.match(result.message, /설정/);
      fail = false;
      await result.onRetry();
      assert.equal(posts, 2, '명시적 재시도에서만 재접수');
      render();
      await tick();
    } else {
      assert.equal(result.pending, true);
      const interval = observers[1].options.refetchInterval;
      assert.equal(
        interval({ state: { status: 'success', data: { story, timedOut: true } } }),
        false,
      );
      assert.equal(interval({ state: { status: 'error' } }), false);
      assert.equal(
        interval({ state: { status: 'success', data: { story, timedOut: false } } }),
        3000,
      );
    }
    detail = { ...story, pages: [{ page: 1, ttsUrl: 'ready.mp3' }] };
    await observers[1].refetch();
    result = render();
    assert.equal(result.pages[0].ttsUrl, 'ready.mp3');
    assert.equal(result.pending, false);
    assert.equal(result.message, undefined);
    assert.equal(observers[1].options.enabled, false, '완료 시 폴링 중단');
  } finally {
    subscriptions.forEach((unsubscribe) => unsubscribe());
    client.clear();
  }
}

(async () => {
  await scenario({ ready: true });
  await scenario();
  await scenario({ reject: true });
  console.log('PASS: 기존 음성, 중복 방지, 백그라운드, 실패/재시도, 폴링 종료, URL 반영');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
