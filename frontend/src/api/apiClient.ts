import axios, {
  type InternalAxiosRequestConfig,
} from 'axios';
import { router } from 'expo-router';

import { showToast } from '../components/Toast';

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from '../utils/tokenStorage';

// .env 파일에서 백엔드 서버 주소 가져오기
const RAW_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'http://localhost:8080';

// API 주소 끝의 /api 및 / 제거
const API_BASE_URL = RAW_API_BASE_URL
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/api$/i, '');

// 공통 Axios 인스턴스
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 모든 API 요청에 로그인 토큰 자동 첨부
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAccessToken();

      if (token) {
        config.headers.set(
          'Authorization',
          `Bearer ${token}`
        );
      }

      return config;
    } catch (error) {
      console.error(
        '[API] 토큰 조회 실패:',
        error
      );

      return Promise.reject(error);
    }
  },
  (error) => Promise.reject(error)
);

// 재시도 요청 설정
type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

// 중복 토큰 갱신 방지
let refreshRequest: Promise<string | null> | null = null;

// 비밀번호 변경은 로그인이 필요한 API라 /api/auth/ 중에서도 갱신 대상이다
const PASSWORD_CHANGE_PATH = '/api/auth/password';

// 세션 종료: 토큰을 지우고 로그인 화면으로 보낸다
async function endSession(): Promise<void> {
  await clearTokens();
  showToast('로그인이 만료되었어요. 다시 로그인해 주세요.', 'error');
  router.replace('/auth/login');
}

// 액세스 토큰 갱신. 다시 로그인해야 하면 null (서버 장애·네트워크 오류는 예외)
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  let data;

  try {
    ({ data } = await axios.post(
      `${API_BASE_URL}/api/auth/refresh`,
      {
        refreshToken,
      },
      {
        timeout: 10000,
      }
    ));
  } catch (error) {
    const status = axios.isAxiosError(error)
      ? error.response?.status
      : undefined;

    // 서버가 재발급을 거절한 경우에만 세션을 끝낸다
    if (status === 401 || status === 403) {
      return null;
    }

    throw error;
  }

  if (
    typeof data?.accessToken !== 'string' ||
    typeof data?.refreshToken !== 'string'
  ) {
    throw new Error('토큰 재발급 응답이 올바르지 않습니다.');
  }

  await saveTokens(
    data.accessToken,
    data.refreshToken
  );

  return data.accessToken;
}

// 공통 API 응답 오류 처리
// 만료된 액세스 토큰은 한 번 갱신 후 기존 요청 재시도
apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const original = error.config as
      | RetryConfig
      | undefined;

    const url = original?.url ?? '';

    const canRefresh =
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      // 로그인하지 않은 요청이거나 비밀번호가 틀린 응답이면 갱신하지 않는다
      original.headers.has('Authorization') &&
      error.response.data?.code !== 'INVALID_CREDENTIALS' &&
      (!url.includes('/api/auth/') || url === PASSWORD_CHANGE_PATH);

    if (canRefresh && original) {
      original._retry = true;

      try {
        if (!refreshRequest) {
          refreshRequest = refreshAccessToken()
            .then(async (token) => {
              // 이미 로그아웃했으면(토큰 없음) 다시 안내하지 않는다
              if (!token && (await getAccessToken())) {
                await endSession();
              }

              return token;
            })
            .finally(() => {
              refreshRequest = null;
            });
        }

        const accessToken = await refreshRequest;

        if (!accessToken) {
          return Promise.reject(error);
        }

        original.headers.set(
          'Authorization',
          `Bearer ${accessToken}`
        );

        return apiClient(original);
      } catch (refreshError) {
        // 네트워크 오류나 서버 장애: 토큰을 유지해 다음 요청에서 다시 시도한다
        return Promise.reject(refreshError);
      }
    }

    if (axios.isAxiosError(error)) {
      console.error('[API] 요청 실패:', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.message,
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;