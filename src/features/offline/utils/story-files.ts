import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import type { Story, StoryPage } from '@/features/story/api/types';

// 한 번 연 동화를 계정별 문서 폴더에 저장해요.
// offline-stories/<계정>/<동화 id>/story.json + 삽화 · 음성 파일
// 앱 업데이트로 컨테이너 경로가 바뀔 수 있어 story.json 에는 파일 이름만 적어요.
const ROOT = 'offline-stories';
const MANIFEST = 'story.json';
const MANIFEST_VERSION = 1;

// 웹은 파일 시스템이 없어서 저장하지 않아요.
const SUPPORTED = Platform.OS !== 'web';

// 서버 주소 하나와 그 주소로 받은 파일 이름
type SavedFile = { url: string; file: string };

type Manifest = {
  version: number;
  savedAt: number;
  // 서버에서 받은 그대로의 동화. (주소도 서버 주소 그대로예요)
  story: Story;
  // 쪽 번호 → 파일
  images: Record<string, SavedFile>;
  tts: Record<string, SavedFile>;
};

const isRemote = (url: string | null | undefined): url is string =>
  typeof url === 'string' && /^https?:\/\//.test(url);

// 서명된 주소는 조회할 때마다 쿼리만 바뀌어요. 같은 파일을 다시 받지 않게 쿼리를 빼고 비교해요.
const sameSource = (a: string, b: string) => a.split('?')[0] === b.split('?')[0];

function extensionOf(url: string, fallback: string) {
  // 경로가 없는 주소(https://cdn.example.com)의 도메인을 확장자로 읽지 않게 경로만 봐요.
  const path = url.split('?')[0].replace(/^https?:\/\/[^/]*/, '');
  const match = /\.([A-Za-z0-9]{2,5})$/.exec(path);
  return match ? `.${match[1].toLowerCase()}` : fallback;
}

const storyDir = (userId: string, storyId: string) =>
  new Directory(Paths.document, ROOT, encodeURIComponent(userId), storyId);

async function readManifest(dir: Directory): Promise<Manifest | null> {
  const file = new File(dir, MANIFEST);
  if (!file.exists) return null;
  try {
    const data: unknown = JSON.parse(await file.text());
    if (
      typeof data !== 'object' ||
      data === null ||
      !('version' in data) ||
      data.version !== MANIFEST_VERSION
    ) {
      return null;
    }
    return data as Manifest;
  } catch {
    return null;
  }
}

async function writeManifest(dir: Directory, manifest: Manifest) {
  const file = new File(dir, MANIFEST);
  if (!file.exists) file.create();
  await file.write(JSON.stringify(manifest));
}

function removeFile(dir: Directory, name: string) {
  try {
    const file = new File(dir, name);
    if (file.exists) file.delete();
  } catch {
    // 남은 파일은 화면에 영향이 없어요.
  }
}

// 쪽마다 주소가 바뀌었거나 파일이 없을 때만 내려받아요. 실패한 쪽은 다음에 열 때 다시 받아요.
async function syncFiles(
  dir: Directory,
  current: Record<string, SavedFile>,
  sources: { page: number; url: string }[],
  prefix: string,
  fallbackExt: string,
) {
  const next = { ...current };
  for (const { page, url } of sources) {
    const key = String(page);
    const saved = next[key];
    if (saved && sameSource(saved.url, url) && new File(dir, saved.file).exists) {
      next[key] = { ...saved, url };
      continue;
    }
    // 같은 이름이면 expo-image · 플레이어가 예전 파일을 캐시에서 쓸 수 있어 매번 새 이름을 써요.
    const name = `${prefix}-${page}-${Date.now()}${extensionOf(url, fallbackExt)}`;
    try {
      await File.downloadFileAsync(url, new File(dir, name), { idempotent: true });
      if (saved) removeFile(dir, saved.file);
      next[key] = { url, file: name };
    } catch {
      removeFile(dir, name);
    }
  }
  return next;
}

// 같은 동화를 동시에 저장하면 파일 목록이 엉켜서, 동화마다 차례대로 저장해요.
const queues = new Map<string, Promise<unknown>>();
function enqueue<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = queues.get(key) ?? Promise.resolve();
  const run = previous.catch(() => undefined).then(task);
  queues.set(key, run);
  void run.finally(() => {
    if (queues.get(key) === run) queues.delete(key);
  });
  return run;
}

// 동화 본문과 삽화를 저장해요. 본문이 저장되면 true 예요. (삽화는 받을 수 있는 만큼만)
export function saveStoryOffline(userId: string, story: Story): Promise<boolean> {
  if (!SUPPORTED) return Promise.resolve(false);
  return enqueue(`${userId}/${story.id}`, async () => {
    const dir = storyDir(userId, story.id);
    dir.create({ intermediates: true, idempotent: true });
    const previous = await readManifest(dir);
    // 음성 주소는 아래 saveNarrationOffline 이 따로 관리해요.
    const pages = story.pages.map(({ ttsUrl: _ttsUrl, ...page }) => page);
    const images = await syncFiles(
      dir,
      previous?.images ?? {},
      pages.flatMap((page) =>
        isRemote(page.imageUrl) ? [{ page: page.page, url: page.imageUrl }] : [],
      ),
      'image',
      '.jpg',
    );
    await writeManifest(dir, {
      version: MANIFEST_VERSION,
      savedAt: Date.now(),
      story: { ...story, pages },
      images,
      tts: previous?.tts ?? {},
    });
    return true;
  });
}

// 확인된 낭독 음성을 저장해요. 본문이 먼저 저장된 동화만 저장해요.
export function saveNarrationOffline(userId: string, storyId: string, pages: StoryPage[]) {
  const sources = pages.flatMap((page) =>
    isRemote(page.ttsUrl) ? [{ page: page.page, url: page.ttsUrl }] : [],
  );
  if (!SUPPORTED || sources.length === 0) return Promise.resolve();
  return enqueue(`${userId}/${storyId}`, async () => {
    const dir = storyDir(userId, storyId);
    const manifest = await readManifest(dir);
    if (!manifest) return;
    const tts = await syncFiles(dir, manifest.tts, sources, 'voice', '.mp3');
    await writeManifest(dir, { ...manifest, tts });
  });
}

// 저장한 동화를 읽어요. 저장한 파일이 있으면 기기 주소로 바꿔서 돌려줘요.
export async function loadOfflineStory(userId: string, storyId: string): Promise<Story | null> {
  if (!SUPPORTED) return null;
  const dir = storyDir(userId, storyId);
  if (!dir.exists) return null;
  const manifest = await readManifest(dir);
  if (!manifest) return null;
  const localUri = (saved?: SavedFile) => {
    if (!saved) return null;
    const file = new File(dir, saved.file);
    return file.exists ? file.uri : null;
  };
  return {
    ...manifest.story,
    pages: manifest.story.pages.map((page) => ({
      ...page,
      // 삽화를 못 받았으면 서버 주소를 그대로 둬요. (expo-image 디스크 캐시에 남아 있을 수 있어요)
      imageUrl: localUri(manifest.images[page.page]) ?? page.imageUrl,
      ttsUrl: localUri(manifest.tts[page.page]),
    })),
  };
}
