import { useCallback, useRef, useState } from 'react';
import { readingApi } from '@/features/fe1/api/readingApi';
import { MAX_RECENT_SEARCHES } from '../../constants/options';
import type { BookSearchItem, SearchCategory, SearchSort } from '../../types/reading';
import { toAppError, type AppError } from '../../utils/apiError';

/**
 * 최근 검색어. 저장 위치·유지 기간이 미확정이므로 앱 실행 중 메모리에만 유지한다.
 * (영구 저장이 확정되면 이 부분만 교체한다.)
 */
let sessionRecentSearches: string[] = [];

export type SearchStatus = 'initial' | 'loading' | 'success' | 'empty' | 'error';

export function useBookSearch() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategoryState] = useState<SearchCategory>('all');
  const [sort, setSortState] = useState<SearchSort>('accuracy');
  const [recentSearches, setRecentSearches] = useState<string[]>(sessionRecentSearches);
  const [books, setBooks] = useState<BookSearchItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [status, setStatus] = useState<SearchStatus>('initial');
  const [error, setError] = useState<AppError | null>(null);
  /** 마지막으로 검색한 검색어 (카테고리/정렬 변경 시 재검색 기준) */
  const [lastKeyword, setLastKeyword] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const rememberKeyword = (keyword: string) => {
    sessionRecentSearches = [keyword, ...sessionRecentSearches.filter(k => k !== keyword)].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(sessionRecentSearches);
  };

  const runSearch = useCallback(async (keyword: string, category: SearchCategory, nextSort: SearchSort) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    const requestId = ++requestIdRef.current;
    setStatus('loading');
    setError(null);
    setLastKeyword(trimmed);
    rememberKeyword(trimmed);
    try {
      const result = await readingApi.searchBooks({ keyword: trimmed, category, sort: nextSort });
      if (requestId !== requestIdRef.current) return;
      setBooks(result.items);
      setTotalCount(result.totalCount);
      setStatus(result.items.length > 0 ? 'success' : 'empty');
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setError(toAppError(e));
      setStatus('error');
    }
  }, []);

  const searchBooks = () => runSearch(searchKeyword, selectedCategory, sort);

  const selectRecentSearch = (keyword: string) => {
    setSearchKeyword(keyword);
    void runSearch(keyword, selectedCategory, sort);
  };

  /** 카테고리 변경 시 검색 조건 갱신 (이미 검색한 상태면 재검색) */
  const setSelectedCategory = (category: SearchCategory) => {
    setSelectedCategoryState(category);
    if (lastKeyword) void runSearch(lastKeyword, category, sort);
  };

  const setSort = (nextSort: SearchSort) => {
    setSortState(nextSort);
    if (lastKeyword) void runSearch(lastKeyword, selectedCategory, nextSort);
  };

  const clearRecentSearches = () => {
    sessionRecentSearches = [];
    setRecentSearches([]);
  };

  const retry = () => {
    if (lastKeyword) void runSearch(lastKeyword, selectedCategory, sort);
  };

  return {
    searchKeyword,
    selectedCategory,
    recentSearches,
    sort,
    books,
    totalCount,
    status,
    isLoading: status === 'loading',
    error,
    setSearchKeyword,
    setSelectedCategory,
    setSort,
    searchBooks,
    selectRecentSearch,
    clearRecentSearches,
    retry,
  };
}
