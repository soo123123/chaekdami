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
