
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// 토큰 저장에 사용할 이름
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// 로그인·로그아웃할 때마다 바뀌는 번호 (토큰 재발급으로는 바뀌지 않는다)
let sessionId = 0;

// 토큰 쓰기를 순서대로 처리해 저장과 삭제가 섞이지 않게 한다
let writeQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(task);
  writeQueue = result.catch(() => undefined);
  return result;
}

// 지금 로그인 세션의 번호
export function getSessionId(): number {
  return sessionId;
}

// 새로 로그인한 토큰 저장하기
export async function saveTokens(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  sessionId += 1;
  await enqueue(() => writeTokens(accessToken, refreshToken));
}

// 재발급한 토큰 저장하기. 그사이 로그아웃했거나 새로 로그인했으면 버리고 false
export async function replaceTokens(
  session: number,
  accessToken: string,
  refreshToken: string
): Promise<boolean> {
  return enqueue(async () => {
    if (session !== sessionId) return false;

    await writeTokens(accessToken, refreshToken);
    return session === sessionId;
  });
}

async function writeTokens(
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
  await writeQueue;

  if (Platform.OS === 'web') {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }

  return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

// Refresh Token 불러오기
export async function getRefreshToken(): Promise<string | null> {
  await writeQueue;

  if (Platform.OS === 'web') {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  }

  return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

// 로그아웃 시 토큰 삭제하기
export async function clearTokens(): Promise<void> {
  sessionId += 1;
  await enqueue(removeTokens);
}

// 세션이 그대로일 때만 토큰 삭제하기. 이미 로그아웃했거나 새로 로그인했으면 false
export async function clearTokensOf(session: number): Promise<boolean> {
  if (session !== sessionId) return false;

  await clearTokens();
  return true;
}

async function removeTokens(): Promise<void> {
  if (Platform.OS === 'web') {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
