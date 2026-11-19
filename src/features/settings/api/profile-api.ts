import type { Gender } from '@/features/auth/api/types';
import type {
  ApiGender,
  Profile,
  ProfileDto,
  ProfileUpdate,
  ProfileUpdateDto,
} from '@/features/settings/api/types';
import {
  API_URL,
  ApiError,
  authHeaders,
  notifyUnauthorized,
  request,
  REQUEST_TIMEOUT_MS,
  toApiError,
} from '@/lib/api-client';

const TO_API_GENDER: Record<Gender, ApiGender> = { M: 'MALE', W: 'FEMALE' };
const FROM_API_GENDER: Record<ApiGender, Gender> = { MALE: 'M', FEMALE: 'W' };

const toProfile = (dto: ProfileDto): Profile => ({
  nickname: dto.username,
  gender: FROM_API_GENDER[dto.gender],
  age: dto.age,
});

// 마이페이지 조회
export async function fetchProfile(signal?: AbortSignal): Promise<Profile> {
  const dto = await request<ProfileDto>('/api/users/profile', { signal });
  return toProfile(dto);
}

// 마이페이지 수정: 성별 · 나이를 함께 보내야 해요.
export async function updateProfile(next: ProfileUpdate): Promise<Profile> {
  const body: ProfileUpdateDto = { gender: TO_API_GENDER[next.gender], age: next.age };
  const dto = await request<ProfileDto>('/api/users/profile', { method: 'PUT', body });
  return toProfile(dto);
}

// 목소리 학습은 녹음 파일을 올리고 변환해서 기본 타임아웃보다 길게 기다려요.
const VOICE_UPLOAD_TIMEOUT_MS = REQUEST_TIMEOUT_MS * 3;

// 목소리 학습 요청: 녹음한 .m4a 파일을 multipart 의 m4aFile 로 올려요. (서버가 .m4a 만 받아요)
export async function uploadVoiceSample(fileUri: string): Promise<void> {
  const form = new FormData();
  // RN 의 FormData 는 { uri, name, type } 객체로 파일을 붙여요.
  form.append('m4aFile', {
    uri: fileUri,
    name: 'voice.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VOICE_UPLOAD_TIMEOUT_MS);
  try {
    // Content-Type 은 fetch 가 boundary 와 함께 채워요.
    const headers = await authHeaders();
    let res: Response;
    try {
      res = await fetch(`${API_URL}/api/users/voice`, {
        method: 'POST',
        headers,
        body: form,
        signal: controller.signal,
      });
    } catch {
      throw new ApiError(0, 'NETWORK', '목소리를 보내지 못했어요. 잠시 후 다시 시도해 주세요');
    }
    if (res.status === 401 && 'Authorization' in headers) notifyUnauthorized();
    if (!res.ok) throw await toApiError(res, '목소리를 등록하지 못했어요');
  } finally {
    clearTimeout(timer);
  }
}
