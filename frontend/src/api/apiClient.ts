
import axios from 'axios';
import { getAccessToken } from '../utils/tokenStorage';

// .env 파일에서 백엔드 서버 주소 가져오기
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL;

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

// 공통 API 응답 오류 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
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
