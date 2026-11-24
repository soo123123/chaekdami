import axios, {
  type InternalAxiosRequestConfig,
} from 'axios';

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

// 액세스 토큰 갱신
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  const { data } = await axios.post(
    `${API_BASE_URL}/api/auth/refresh`,
    {
      refreshToken,
    },
    {
      timeout: 10000,
    }
  );

  if (
    typeof data?.accessToken !== 'string' ||
    typeof data?.refreshToken !== 'string'
  ) {
    return null;
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
      !url.includes('/api/auth/');

    if (canRefresh && original) {
      original._retry = true;

      try {
        if (!refreshRequest) {
          refreshRequest = refreshAccessToken().finally(
            () => {
              refreshRequest = null;
            }
          );
        }

        const accessToken = await refreshRequest;

        if (!accessToken) {
          await clearTokens();
          return Promise.reject(error);
        }

        original.headers.set(
          'Authorization',
          `Bearer ${accessToken}`
        );

        return apiClient(original);
      } catch (refreshError) {
        await clearTokens();

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