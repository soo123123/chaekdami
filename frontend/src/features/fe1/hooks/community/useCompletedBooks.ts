import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { readingApi } from '@/features/fe1/api/readingApi';
import type { BookId, RegisteredBook } from '../../types/reading';
import { useAsyncResource } from '../common/useAsyncResource';

/**
 * 커뮤니티에서 고를 수 있는 내 완독 도서 목록 + 선택 상태.
 * - 커뮤니티 API가 ISBN 기준이라, 직접 등록해 ISBN이 없는 완독 도서는 제외한다.
 * - initialBookId(라우트 파라미터)가 목록에 있으면 그 책을 처음 선택한다.
 */
export function useCompletedBooks(initialBookId: BookId | null) {
  const { data: books, error, isLoading, reload } = useAsyncResource(() => readingApi.getLibraryBooks(), []);
  const [selectedBookId, setSelectedBookId] = useState<BookId | null>(initialBookId);

  // 다른 화면에서 완독하고 돌아오면 목록을 다시 조회한다.
  const isFirstFocusRef = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }
      void reload();
    }, [reload]),
  );

  const { communityBooks, manualOnlyCount } = useMemo(() => {
    const completed = (books ?? [])
      .filter(b => b.status === 'COMPLETED')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const withIsbn = completed.filter((b): b is RegisteredBook & { isbn: string } => !!b.isbn?.trim());
    return { communityBooks: withIsbn, manualOnlyCount: completed.length - withIsbn.length };
  }, [books]);

  const selectedBook = communityBooks.find(b => b.bookId === selectedBookId) ?? communityBooks[0] ?? null;

  return {
    books: communityBooks,
    selectedBook,
    selectBook: setSelectedBookId,
    /** 완독했지만 ISBN이 없어 커뮤니티를 쓸 수 없는 책 수 */
    manualOnlyCount,
    isLoading: isLoading && !books,
    error: books ? null : error,
    reload,
  };
}
