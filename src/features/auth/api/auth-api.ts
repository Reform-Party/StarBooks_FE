import {
  FROM_API_GENDER,
  type LoginBody,
  type ProfileDto,
  type SignupBody,
  type SignupDto,
  TO_API_GENDER,
  type User,
} from '@/features/auth/api/types';
import { ApiError, request, requestWithHeaders, setAccessToken } from '@/lib/api-client';
import * as SecureStorage from '@/lib/secure-storage';

const LOGIN_PATH = '/api/auth/login';
// 서버 경로는 sign-up 이에요. (signup 아님)
const SIGNUP_PATH = '/api/auth/sign-up';
const PROFILE_PATH = '/api/users/profile';

// 프로필 응답에 아이디가 없어서, 로그인한 아이디를 토큰과 함께 기기에 둬요.
const USER_ID_KEY = 'userId';

// 응답 헤더 "Authorization: Bearer <token>" 에서 토큰만 꺼내요.
const bearerToken = (headers: Headers) =>
  headers
    .get('Authorization')
    ?.match(/^Bearer\s+(.+)$/i)?.[1]
    ?.trim() || null;

// 로그인 · 회원가입 모두 응답 헤더로 토큰(JWT)을 줘요. 저장하고 유저 정보를 받아 와요.
async function startSession(headers: Headers, userId: string, failMessage: string) {
  const token = bearerToken(headers);
  if (!token) throw new ApiError(500, 'NO_TOKEN', failMessage);

  await setAccessToken(token);
  await SecureStorage.setItem(USER_ID_KEY, userId);
  try {
    return await fetchMe();
  } catch (e) {
    // 유저 정보를 못 받으면 로그인하지 않은 상태로 되돌려요.
    await logout().catch(() => undefined);
    throw e;
  }
}

export async function login({ userId, password }: LoginBody): Promise<User> {
  const { headers } = await requestWithHeaders<null>(LOGIN_PATH, {
    method: 'POST',
    body: { userId, password },
  });
  return startSession(headers, userId, '로그인하지 못했어요. 다시 시도해 주세요');
}

// 가입하면 바로 로그인돼요.
export async function signup({ gender, ...rest }: SignupBody): Promise<User> {
  const body: SignupDto = { ...rest, gender: TO_API_GENDER[gender] };
  const { headers } = await requestWithHeaders<null>(SIGNUP_PATH, { method: 'POST', body });
  try {
    return await startSession(
      headers,
      rest.userId,
      '가입은 됐어요. 로그인 화면에서 로그인해 주세요',
    );
  } catch (e) {
    // 계정은 이미 만들어졌어요. 다시 가입하면 중복 ID 가 되니, 화면이 로그인으로 보내게 따로 알려요.
    // (웹은 서버가 Access-Control-Expose-Headers: Authorization 을 주지 않으면 토큰 헤더를 못 읽어요)
    const status = e instanceof ApiError ? e.status : 0;
    throw new ApiError(status, SIGNED_UP_WITHOUT_SESSION, '가입은 됐어요. 로그인해 주세요');
  }
}

// 가입은 됐지만 바로 로그인하지 못했을 때의 오류 코드
export const SIGNED_UP_WITHOUT_SESSION = 'SIGNED_UP_WITHOUT_SESSION';

export async function fetchMe(): Promise<User> {
  const dto = await request<ProfileDto>(PROFILE_PATH);
  const id = (await SecureStorage.getItem(USER_ID_KEY)) ?? '';
  return {
    id,
    nickname: dto.username,
    age: dto.age,
    gender: FROM_API_GENDER[dto.gender],
  };
}

export async function logout() {
  await setAccessToken(null);
  await SecureStorage.removeItem(USER_ID_KEY);
}
