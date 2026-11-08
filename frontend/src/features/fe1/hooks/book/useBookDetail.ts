import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { readingApi } from '@/features/fe1/api/readingApi';
import { toAppError } from '../../utils/apiError';
import { useAsyncResource } from '../common/useAsyncResource';

/** bookId 기반 등록 도서 상세 + 삭제 */
export function useBookDetail(bookId: number | null) {
  const { data, error, isLoading, reload } = useAsyncResource(
    () => readingApi.getBookDetail(bookId as number),
    [bookId],
    { enabled: bookId !== null },
  );
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  // 독서 기록 저장 후 돌아오면 진행률·문장을 다시 조회한다.
  const isFirstFocusRef = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }
      if (bookId !== null) void reload();
    }, [bookId, reload]),
  );

  /** 서버 삭제 성공 시에만 true */
  const removeBook = async (): Promise<boolean> => {
    if (bookId === null) return false;
    setIsRemoving(true);
    setRemoveError(null);
    try {
      await readingApi.removeBook(bookId);
      return true;
    } catch (e) {
      setRemoveError(toAppError(e).message);
      return false;
    } finally {
      setIsRemoving(false);
    }
  };

  return {
    book: data?.book ?? null,
    readingSummary: data?.readingSummary ?? null,
    sentences: data?.sentences ?? [],
    isLoading,
    error,
    isRemoving,
    removeError,
    removeBook,
    reload,
  };
}
