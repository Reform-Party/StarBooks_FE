import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import { FROM_API_GENDER, TO_API_GENDER } from '@/features/auth/api/types';
import type {
  Profile,
  ProfileDto,
  ProfileUpdate,
  ProfileUpdateDto,
} from '@/features/settings/api/types';
import { ApiError, request, REQUEST_TIMEOUT_MS } from '@/lib/api-client';

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
    if (!blob.size)
      throw new ApiError(0, 'EMPTY_RECORDING', '녹음된 소리가 없어요. 다시 녹음해 주세요.');
    form.append('m4aFile', blob, 'voice.m4a');
  } else {
    const file = new File(fileUri);
    if (!file.exists || file.size === 0)
      throw new ApiError(0, 'EMPTY_RECORDING', '녹음된 소리가 없어요. 다시 녹음해 주세요.');
    // RN 의 FormData 는 { uri, name, type } 객체로 파일을 붙여요.
    form.append('m4aFile', {
      uri: fileUri,
      name: 'voice.m4a',
      type: 'audio/mp4',
    } as unknown as Blob);
  }

  try {
    await request<void>('/api/users/voice', {
      method: 'POST',
      body: form,
      timeoutMs: VOICE_UPLOAD_TIMEOUT_MS,
    });
  } catch (error) {
    if (error instanceof ApiError && ['NETWORK', 'TIMEOUT'].includes(error.code))
      throw new ApiError(
        error.status,
        error.code,
        '목소리 등록 결과를 확인하지 못했어요. 연결을 확인한 뒤 책장에서 동화 재생을 눌러 주세요.',
      );
    throw error;
  }
}
