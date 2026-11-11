import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { readingApi } from '@/features/fe1/api/readingApi';
import { DEFAULT_THEME_ID, LIBRARY_THEMES } from '../../constants/options';
import type { BookStatus, LibraryFilter, LibrarySort, RegisteredBook } from '../../types/reading';
import { calcProgress } from '../../utils/format';
import { useAsyncResource } from '../common/useAsyncResource';
import { setAppliedThemeId, useAppliedThemeId } from './themeStore';

const STATUS_ORDER: BookStatus[] = ['READING', 'COMPLETED', 'NOT_STARTED'];

function sortBooks(books: RegisteredBook[], sortType: LibrarySort): RegisteredBook[] {
  const list = [...books];
  if (sortType === 'title') return list.sort((a, b) => a.title.localeCompare(b.title, 'ko'));
  if (sortType === 'progress') {
    return list.sort((a, b) => (calcProgress(b.currentPage, b.totalPages) ?? -1) - (calcProgress(a.currentPage, a.totalPages) ?? -1));
  }
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** 검색 비교용: 띄어쓰기를 없애고 소문자로 맞춘다 */
function normalize(text: string) {
  return text.replace(/\s+/g, '').toLowerCase();
}

/** 내 서재 목록 + 필터/정렬/서재 내 검색 + 적용된 테마 */
export function useLibraryBooks() {
  const [selectedCategory, setSelectedCategory] = useState<LibraryFilter>('all');
  const [sortType, setSortType] = useState<LibrarySort>('recent');
  /** 서재 안의 책을 제목·저자로 찾는 검색어 (서버 요청 없이 받아 둔 목록에서 거른다) */
  const [searchQuery, setSearchQuery] = useState('');

  const { data: books, error, isLoading, reload } = useAsyncResource(() => readingApi.getLibraryBooks(), []);
  const { data: loadedThemeId, reload: reloadTheme } = useAsyncResource(() => readingApi.getLibraryTheme().catch(() => null), []);
  // 서버에서 받은 테마를 공유 저장소에 반영한다. 서재 꾸미기에서 바꾼 테마는 저장소에 바로 들어와 있어서 깜빡이지 않는다.
  useEffect(() => {
    if (loadedThemeId) setAppliedThemeId(loadedThemeId);
  }, [loadedThemeId]);
  const themeId = useAppliedThemeId() ?? loadedThemeId;

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

  const keyword = normalize(searchQuery);
  const isSearching = keyword.length > 0;

  /** 검색어에 맞는 책 (검색어가 없으면 전체) */
  const matchedBooks = useMemo(() => {
    const list = books ?? [];
    if (!keyword) return list;
    return list.filter(b => normalize(b.title).includes(keyword) || normalize(b.author ?? '').includes(keyword));
  }, [books, keyword]);

  /** 화면에 표시할 책장 섹션 (검색·필터·정렬 반영) */
  const sections = useMemo(() => {
    const sorted = sortBooks(matchedBooks, sortType);
    const statuses = selectedCategory === 'all' ? STATUS_ORDER : [selectedCategory];
    return statuses.map(status => ({ status, books: sorted.filter(b => b.status === status) }));
  }, [matchedBooks, sortType, selectedCategory]);

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
    searchQuery,
    isSearching,
    /** 검색 결과가 하나도 없음 (서재에 책은 있음) */
    hasNoSearchResult: isSearching && !!books && books.length > 0 && sections.every(section => section.books.length === 0),
    setSearchQuery,
    setSelectedCategory,
    setSortType,
    reload,
  };
}
