import { useSyncExternalStore } from 'react';

/**
 * 현재 적용된 서재 테마를 화면들끼리 바로 공유하는 작은 저장소.
 * 서재 꾸미기에서 테마를 고르면 즉시 바뀌어서, 서재로 돌아왔을 때 이전 테마가 잠깐 보이지 않는다.
 * (서버/기기 저장은 readingApi가 담당하고, 이 값은 앱 실행 중 화면 간 공유용이다)
 */
let appliedThemeId: string | null = null;
const listeners = new Set<() => void>();

export function getAppliedThemeId() {
  return appliedThemeId;
}

export function setAppliedThemeId(themeId: string | null) {
  if (appliedThemeId === themeId) return;
  appliedThemeId = themeId;
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAppliedThemeId() {
  return useSyncExternalStore(subscribe, getAppliedThemeId, getAppliedThemeId);
}
