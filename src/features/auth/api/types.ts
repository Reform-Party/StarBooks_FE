// 인증 API 타입 (노션 사용자 API 명세: 회원가입 · 로그인)

// 앱 안에서 쓰는 성별. 서버와 주고받을 때는 ApiGender('MALE' · 'FEMALE')로 바꿔요.
// 서버 성별 값과 변환표는 여기 한 곳에 두고, settings 의 프로필 API 도 이걸 가져가요.
export type Gender = 'M' | 'W';
export type ApiGender = 'MALE' | 'FEMALE';

export const TO_API_GENDER: Record<Gender, ApiGender> = { M: 'MALE', W: 'FEMALE' };
export const FROM_API_GENDER: Record<ApiGender, Gender> = { MALE: 'M', FEMALE: 'W' };

export type User = {
  // 로그인 아이디(userId). 기기에 저장하는 프로필 사진 등의 키로도 써요.
  id: string;
  nickname: string;
  age: number;
  gender: Gender;
};

// 로그인 RequestBody. 응답 data 는 null 이고, 토큰은 응답 헤더 Authorization: Bearer … 로 와요.
// 실패: 400 INVALID_PASSWORD_400 · 404 USER_NOT_FOUND_404
export type LoginBody = { userId: string; password: string };

// 회원가입. 응답 data 는 null 이에요. 실패: 409 DUPLICATED_USER_ID_409
export type SignupBody = LoginBody & { nickname: string; age: number; gender: Gender };
export type SignupDto = LoginBody & { nickname: string; age: number; gender: ApiGender };
