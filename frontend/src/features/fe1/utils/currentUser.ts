import { getAccessToken } from '@/utils/tokenStorage';

/** 로그인 정보가 없을 때(개발용 Mock 등) 쓰는 구분 값 */
const GUEST_USER_KEY = 'guest';

/**
 * 기기에 저장하는 값(서재 테마, 읽던 독서 기록)을 계정별로 나누기 위한 사용자 구분 값.
 * Access Token(JWT)의 subject가 사용자 번호다. 서버 요청 없이 토큰만 읽으며, 서명은 확인하지 않는다(구분 용도라 충분).
 * 같은 기기에서 다른 계정으로 로그인했을 때 이전 계정의 값이 보이지 않게 한다 (ISSUE-DATA-4).
 */
export async function getCurrentUserKey(): Promise<string> {
  try {
    const token = await getAccessToken();
    const payload = token?.split('.')[1];
    if (!payload) return GUEST_USER_KEY;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const { sub } = JSON.parse(atob(padded)) as { sub?: unknown };
    return typeof sub === 'string' && sub ? sub : GUEST_USER_KEY;
  } catch {
    return GUEST_USER_KEY;
  }
}
