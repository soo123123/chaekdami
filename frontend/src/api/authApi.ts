
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'http://localhost:8080';

// 로그인 요청 데이터
export interface LoginRequest {
  email: string;
  password: string;
}

// 로그인 응답 데이터
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

// 사용자 정보
// BE3의 실제 응답 구조가 확인되면 수정할 수 있습니다.
export interface UserInfo {
  id?: number | string;
  email?: string;
  nickname?: string;
  name?: string;
  [key: string]: unknown;
}

// 서버 오류 응답
interface ApiErrorResponse {
  code?: string;
  message?: string;
  fields?: Record<string, string>;
}

// API 오류 클래스
export class AuthApiError extends Error {
  status: number;
  code?: string;

  constructor(
    message: string,
    status: number,
    code?: string
  ) {
    super(message);

    this.name = 'AuthApiError';
    this.status = status;
    this.code = code;
  }
}

// 공통 응답 처리
async function parseResponse(
  response: Response
): Promise<unknown> {
  let result: unknown;

  try {
    result = await response.json();
  } catch {
    throw new AuthApiError(
      '서버 응답을 읽을 수 없습니다.',
      response.status,
      'INVALID_RESPONSE'
    );
  }

  if (!response.ok) {
    const error = result as ApiErrorResponse;

    throw new AuthApiError(
      error?.message || '요청에 실패했습니다.',
      response.status,
      error?.code
    );
  }

  return result;
}

// 로그인 API
export async function login(
  data: LoginRequest
): Promise<LoginResponse> {
  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}/api/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email.trim(),
          password: data.password,
        }),
      }
    );
  } catch {
    throw new AuthApiError(
      '서버에 연결할 수 없습니다. 서버 실행 상태와 주소를 확인해주세요.',
      0,
      'NETWORK_ERROR'
    );
  }

  const result = await parseResponse(response);
  const tokens = result as Partial<LoginResponse>;

  if (
    typeof tokens.accessToken !== 'string' ||
    typeof tokens.refreshToken !== 'string'
  ) {
    throw new AuthApiError(
      '로그인 응답에 필요한 토큰이 없습니다.',
      response.status,
      'INVALID_RESPONSE'
    );
  }

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    tokenType: tokens.tokenType ?? 'Bearer',
  };
}

// 현재 로그인 사용자 조회 API
export async function getMyInfo(
  accessToken: string
): Promise<UserInfo> {
  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}/api/me`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );
  } catch {
    throw new AuthApiError(
      '사용자 정보를 불러올 수 없습니다. 서버 연결을 확인해주세요.',
      0,
      'NETWORK_ERROR'
    );
  }

  const result = await parseResponse(response);

  if (
    !result ||
    typeof result !== 'object' ||
    Array.isArray(result)
  ) {
    throw new AuthApiError(
      '사용자 정보 응답 형식이 올바르지 않습니다.',
      response.status,
      'INVALID_RESPONSE'
    );
  }

  return result as UserInfo;
}
