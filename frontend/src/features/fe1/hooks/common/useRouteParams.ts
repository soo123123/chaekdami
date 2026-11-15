import { useLocalSearchParams } from 'expo-router';

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** 외부 도서 itemId 라우트 파라미터 */
export function useItemIdParam(): string | null {
  const { itemId } = useLocalSearchParams<{ itemId?: string }>();
  const value = first(itemId);
  return value && value.trim() ? value : null;
}

/**
 * 책 정보 화면 파라미터: 이미 내 서재에 있는 책인지 (registered=1).
 * 서재 → 책 상세 → 책 정보 경로로 들어오면 등록 버튼을 비활성화하는 데 쓴다.
 */
export function useRegisteredParam(): boolean {
  const { registered } = useLocalSearchParams<{ registered?: string }>();
  return first(registered) === '1';
}

/**
 * 책 상세 화면 보기 모드.
 * - 'default': 서재에서 들어온 일반 상세 (책 제거·다시 읽기·더보기 메뉴 표시)
 * - 'records': 독서 종료 화면의 '독서 기록 보기'로 들어온 조회 전용 (mode=records)
 */
export type BookDetailMode = 'default' | 'records';

export function useBookDetailModeParam(): BookDetailMode {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  return first(mode) === 'records' ? 'records' : 'default';
}

/** 내부 도서 bookId 라우트 파라미터 (양의 정수만 허용) */
export function useBookIdParam(): number | null {
  const { bookId } = useLocalSearchParams<{ bookId?: string }>();
  return parsePositiveInt(first(bookId));
}

/** 독서 종료 화면 파라미터: bookId + elapsedTime(초) */
export function useReadingEndParams(): { bookId: number | null; elapsedTime: number } {
  const { bookId, elapsedTime } = useLocalSearchParams<{ bookId?: string; elapsedTime?: string }>();
  const seconds = Number(first(elapsedTime));
  return {
    bookId: parsePositiveInt(first(bookId)),
    elapsedTime: Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0,
  };
}

function parsePositiveInt(value?: string): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return parsed > 0 ? parsed : null;
}
