import { useState } from 'react';
import { readingApi } from '@/features/fe1/api/readingApi';
import type { ManualBookInput, RegisteredBook } from '../../types/reading';
import { toAppError } from '../../utils/apiError';
import { isValidIsbn, todayIso } from '../../utils/format';

type Target =
  | { kind: 'catalog'; itemId: string | null }
  | { kind: 'manual' };

const EMPTY_MANUAL_BOOK: ManualBookInput = { title: '', author: '', publisher: '' };

export type ManualFieldErrors = Partial<Record<'title' | 'author' | 'publisher', string>>;

/**
 * 책 등록(검색 도서 / 수동 입력) 상태 관리.
 * 등록 성공 응답을 받은 뒤에만 RegisteredBook을 반환한다.
 */
export function useBookRegistration(target: Target) {
  const [book, setBookState] = useState<ManualBookInput>(EMPTY_MANUAL_BOOK);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState<number | undefined>(undefined);
  const [goalDate, setGoalDate] = useState<string | undefined>(undefined);
  const [goalPage, setGoalPage] = useState<number | undefined>(undefined);
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ManualFieldErrors>({});

  const setBook = (patch: Partial<ManualBookInput>) => {
    setBookState(prev => ({ ...prev, ...patch }));
    setFieldErrors(prev => {
      const next = { ...prev };
      (Object.keys(patch) as (keyof ManualFieldErrors)[]).forEach(key => delete next[key]);
      return next;
    });
  };

  /** 페이지/목표 공통 검증. 오류 메시지 또는 null */
  const validateReadingSettings = (effectiveTotal?: number): string | null => {
    if (currentPage < 0) return '현재 페이지는 0 이상이어야 해요.';
    if (effectiveTotal && currentPage > effectiveTotal) return `현재 페이지는 전체 페이지(${effectiveTotal}쪽)를 넘을 수 없어요.`;
    if (goalPage !== undefined) {
      if (goalPage <= currentPage) return '목표 페이지는 현재 페이지보다 커야 해요.';
      if (effectiveTotal && goalPage > effectiveTotal) return '목표 페이지는 전체 페이지를 넘을 수 없어요.';
    }
    if (goalDate && goalDate < todayIso()) return '목표 날짜는 오늘 이후로 설정해주세요.';
    return null;
  };

  const pageError = (() => {
    if (totalPages && currentPage > totalPages) return `현재 페이지는 전체 페이지(${totalPages}쪽)를 넘을 수 없어요.`;
    return null;
  })();

  /**
   * @param catalogTotalPages 외부 도서 정보의 전체 페이지 수 (검색 도서 등록 시)
   */
  const registerBook = async (catalogTotalPages?: number): Promise<RegisteredBook | null> => {
    setSubmitError(null);
    const effectiveTotal = catalogTotalPages ?? totalPages;

    if (target.kind === 'manual') {
      const errors: ManualFieldErrors = {};
      if (!book.title.trim()) errors.title = '책 제목을 입력해주세요.';
      if (!book.author.trim()) errors.author = '저자를 입력해주세요.';
      if (!book.publisher.trim()) errors.publisher = '출판사를 입력해주세요.';
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
        setSubmitError('필수 정보를 입력해주세요.');
        return null;
      }
      if (book.isbn && !isValidIsbn(book.isbn)) {
        setSubmitError('ISBN은 10자리 또는 13자리 숫자여야 해요.');
        return null;
      }
    }
    if (target.kind === 'catalog' && !target.itemId) {
      setSubmitError('등록할 책 정보가 없어요. 다시 검색해주세요.');
      return null;
    }

    const settingsError = validateReadingSettings(effectiveTotal);
    if (settingsError) {
      setSubmitError(settingsError);
      return null;
    }

    const settings = { currentPage, totalPages: effectiveTotal, goalDate, goalPage, isPublic };
    setIsLoading(true);
    try {
      const registered = target.kind === 'catalog'
        ? await readingApi.registerCatalogBook({ itemId: target.itemId as string, ...settings })
        : await readingApi.registerManualBook({
            ...settings,
            book: {
              ...book,
              title: book.title.trim(),
              author: book.author.trim(),
              publisher: book.publisher.trim(),
              isbn: book.isbn?.trim() || undefined,
            },
          });
      return registered;
    } catch (e) {
      setSubmitError(toAppError(e).message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    book,
    currentPage,
    totalPages,
    goalDate,
    goalPage,
    isPublic,
    isLoading,
    submitError,
    fieldErrors,
    pageError,
    setBook,
    setCurrentPage,
    setTotalPages,
    setGoalDate,
    setGoalPage,
    setIsPublic,
    registerBook,
  };
}
