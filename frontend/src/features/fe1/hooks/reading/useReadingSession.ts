import { useState } from 'react';
import { readingApi } from '@/features/fe1/api/readingApi';
import { useAsyncResource } from '../common/useAsyncResource';

/** 독서 중인 책 정보, 집중 모드, 독서 시간 요약(FE2) */
export function useReadingSession(bookId: number | null) {
  const [isFocusMode, setIsFocusMode] = useState(false);

  const { data, error, isLoading, reload } = useAsyncResource(
    () => readingApi.getBookDetail(bookId as number),
    [bookId],
    { enabled: bookId !== null },
  );
  // 요약은 실패해도 독서는 계속할 수 있어야 하므로 오류를 무시하고 null로 둔다.
  const { data: readingTimeSummary } = useAsyncResource(
    () => readingApi.getReadingTimeSummary(bookId as number).catch(() => null),
    [bookId],
    { enabled: bookId !== null },
  );

  return {
    book: data?.book ?? null,
    isFocusMode,
    readingTimeSummary: readingTimeSummary ?? null,
    isLoading,
    error,
    reload,
    toggleFocusMode: () => setIsFocusMode(v => !v),
  };
}
