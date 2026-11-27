import { Directory, File, Paths } from 'expo-file-system';

// 앨범에서 고른 사진은 picker 캐시에 있어서 OS 가 지우거나 앱 업데이트로 경로가 바뀔 수 있어요.
// 그래서 문서 폴더로 복사하고 파일 이름만 저장한 뒤, 그릴 때마다 경로를 만들어요.
const PHOTO_DIR = 'profile-photos';

// 캐시에 있는 사진을 문서 폴더로 복사하고 새 파일 이름을 돌려줘요.
export async function saveProfilePhoto(cacheUri: string): Promise<string> {
  const dir = new Directory(Paths.document, PHOTO_DIR);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  const source = new File(cacheUri);
  // 같은 이름이면 expo-image 가 예전 사진을 캐시에서 보여줄 수 있어 매번 새 이름을 써요.
  const name = `${Date.now()}${source.extension || '.jpg'}`;
  await source.copy(new File(dir, name));
  return name;
}

export function profilePhotoUri(name: string): string {
  return new File(Paths.document, PHOTO_DIR, name).uri;
}

// 바꾸거나 기본 프로필로 돌리면 예전 사진은 지워요. 없거나 못 지우면 그냥 넘어가요.
export function deleteProfilePhoto(name: string) {
  try {
    const file = new File(Paths.document, PHOTO_DIR, name);
    if (file.exists) file.delete();
  } catch {
    // 남은 파일은 화면에 영향이 없어요.
  }
}
