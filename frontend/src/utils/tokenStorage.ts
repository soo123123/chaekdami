
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// 토큰 저장에 사용할 이름
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// 토큰 저장하기
export async function saveTokens(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  if (Platform.OS === 'web') {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    return;
  }

  await SecureStore.setItemAsync(
    ACCESS_TOKEN_KEY,
    accessToken
  );

  await SecureStore.setItemAsync(
    REFRESH_TOKEN_KEY,
    refreshToken
  );
}

// Access Token 불러오기
export async function getAccessToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }

  return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

// Refresh Token 불러오기
export async function getRefreshToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  }

  return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

// 토큰이 지워질 때(로그아웃·탈퇴·세션 만료) 알릴 곳. 독서 알림 취소가 쓴다 (스펙 014 R3).
// 이 파일이 알림 모듈을 직접 불러오면 apiClient와 서로 참조하게 되어 등록 방식으로 둔다.
type TokensClearedListener = () => void;
const tokensClearedListeners = new Set<TokensClearedListener>();

export function onTokensCleared(listener: TokensClearedListener): () => void {
  tokensClearedListeners.add(listener);
  return () => {
    tokensClearedListeners.delete(listener);
  };
}

// 로그아웃 시 토큰 삭제하기
export async function clearTokens(): Promise<void> {
  tokensClearedListeners.forEach(listener => listener());

  if (Platform.OS === 'web') {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
