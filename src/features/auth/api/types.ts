// 인증 API 타입. 백엔드 명세가 확정되면 필드 이름을 여기서 맞춰요.

export type Gender = 'M' | 'W';

export type User = {
  id: string;
  email: string;
  nickname: string;
  age: number;
  gender: Gender;
};

export type LoginBody = { email: string; password: string };

// POST /api/auth/login — 토큰 필드 이름이 정해지지 않아 accessToken · token 둘 다 받아요.
export type LoginData = { user: User; accessToken?: string; token?: string };

export type SignupBody = LoginBody & { nickname: string; age: number; gender: Gender };

// POST /api/auth/signup · GET /api/auth/me
export type UserData = { user: User };
