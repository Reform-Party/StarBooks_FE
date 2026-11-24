import { Platform } from 'react-native';

import type { Gender } from '@/features/auth/api/types';
import type {
  ApiGender,
  Profile,
  ProfileDto,
  ProfileUpdate,
  ProfileUpdateDto,
} from '@/features/settings/api/types';
import { request, REQUEST_TIMEOUT_MS } from '@/lib/api-client';

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
  if (Platform.OS === 'web') {
    // 브라우저 FormData 는 { uri } 객체를 "[object Object]" 글자로 보내서 파일이 빠져요. (서버: GLOBAL_400_3)
    // 녹음 결과(blob: 주소)를 Blob 으로 읽어 붙여요. 웹 녹음은 webm 이지만 서버가 이름으로만 검사하고 ffmpeg 가 내용을 읽어요.
    const blob = await (await fetch(fileUri)).blob();
    form.append('m4aFile', blob, 'voice.m4a');
  } else {
    // RN 의 FormData 는 { uri, name, type } 객체로 파일을 붙여요.
    form.append('m4aFile', {
      uri: fileUri,
      name: 'voice.m4a',
      type: 'audio/mp4',
    } as unknown as Blob);
  }

  await request<void>('/api/users/voice', {
    method: 'POST',
    body: form,
    timeoutMs: VOICE_UPLOAD_TIMEOUT_MS,
  });
}
