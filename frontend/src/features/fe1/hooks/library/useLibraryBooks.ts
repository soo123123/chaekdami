import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { readingApi } from '@/features/fe1/api/readingApi';
import { DEFAULT_THEME_ID, LIBRARY_THEMES } from '../../constants/options';
import type { BookStatus, LibraryFilter, LibrarySort, RegisteredBook } from '../../types/reading';
import { calcProgress } from '../../utils/format';
import { useAsyncResource } from '../common/useAsyncResource';

const STATUS_ORDER: BookStatus[] = ['READING', 'COMPLETED', 'NOT_STARTED'];

function sortBooks(books: RegisteredBook[], sortType: LibrarySort): RegisteredBook[] {
  const list = [...books];
  if (sortType === 'title') return list.sort((a, b) => a.title.localeCompare(b.title, 'ko'));
  if (sortType === 'progress') {
    return list.sort((a, b) => (calcProgress(b.currentPage, b.totalPages) ?? -1) - (calcProgress(a.currentPage, a.totalPages) ?? -1));
  }
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** 내 서재 목록 + 필터/정렬 + 적용된 테마 */
export function useLibraryBooks() {
  const [selectedCategory, setSelectedCategory] = useState<LibraryFilter>('all');
  const [sortType, setSortType] = useState<LibrarySort>('recent');

  const { data: books, error, isLoading, reload } = useAsyncResource(() => readingApi.getLibraryBooks(), []);
  const { data: themeId, reload: reloadTheme } = useAsyncResource(() => readingApi.getLibraryTheme().catch(() => null), []);

  // 다른 화면(등록/삭제/기록/테마 변경)에서 돌아오면 서버 데이터를 다시 조회한다.
  const isFirstFocusRef = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }
      void reload();
      void reloadTheme();
    }, [reload, reloadTheme]),
  );

  const counts = useMemo(() => {
    const list = books ?? [];
    return {
      all: list.length,
      READING: list.filter(b => b.status === 'READING').length,
      COMPLETED: list.filter(b => b.status === 'COMPLETED').length,
      NOT_STARTED: list.filter(b => b.status === 'NOT_STARTED').length,
    } satisfies Record<LibraryFilter, number>;
  }, [books]);

  /** 화면에 표시할 책장 섹션 (필터·정렬 반영) */
  const sections = useMemo(() => {
    const sorted = sortBooks(books ?? [], sortType);
    const statuses = selectedCategory === 'all' ? STATUS_ORDER : [selectedCategory];
    return statuses.map(status => ({ status, books: sorted.filter(b => b.status === status) }));
  }, [books, sortType, selectedCategory]);

  const theme = LIBRARY_THEMES.find(t => t.themeId === themeId) ?? LIBRARY_THEMES.find(t => t.themeId === DEFAULT_THEME_ID)!;

  return {
    books,
    sections,
    counts,
    theme,
    selectedCategory,
    sortType,
    isLoading,
    error,
    isEmpty: !!books && books.length === 0,
    setSelectedCategory,
    setSortType,
    reload,
  };
}
