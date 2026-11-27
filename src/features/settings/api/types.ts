// 서버 성별 값(ApiGender)과 변환표는 auth 에 한 곳으로 두고 가져와요.
import type { ApiGender, Gender } from '@/features/auth/api/types';

// GET · PUT /api/users/profile 의 data
export type ProfileDto = {
  username: string;
  gender: ApiGender;
  age: number;
};

// PUT /api/users/profile body. 서버 검증: age 1~10
export type ProfileUpdateDto = {
  gender: ApiGender;
  age: number;
};

export type Profile = {
  nickname: string;
  gender: Gender;
  age: number;
};

export type ProfileUpdate = Pick<Profile, 'gender' | 'age'>;

// 서버가 받는 나이 범위 (ProfileUpdateReq @Min · @Max)
export const PROFILE_AGE_MIN = 1;
export const PROFILE_AGE_MAX = 10;
