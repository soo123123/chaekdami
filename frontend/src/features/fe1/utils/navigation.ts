import { router, type Href } from 'expo-router';

/**
 * 이전 화면이 있으면 뒤로 가고, 없으면 fallback 화면으로 교체한다.
 * 화면이 스택 맨 아래에 있으면(딥링크로 바로 열었거나, 독서 완료의 '계속 독서하기'처럼 replace로 들어온 경우)
 * router.back()이 갈 곳이 없어 "GO_BACK was not handled" 오류가 나기 때문이다.
 */
export function goBackOr(fallback: Href) {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}
