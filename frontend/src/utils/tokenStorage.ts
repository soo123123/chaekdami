
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

// 로그아웃 시 토큰 삭제하기
export async function clearTokens(): Promise<void> {
  if (Platform.OS === 'web') {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
