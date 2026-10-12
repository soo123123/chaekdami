import { useEffect, useRef, useState } from 'react';
import { readingApi } from '@/api/readingApi';
import type { ReadingPhoto, ReadingRecordResult } from '../../types/reading';
import { toAppError } from '../../utils/apiError';
import { validatePageRange } from '../../utils/validation';
import { useAsyncResource } from '../common/useAsyncResource';

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

/**
 * 독서 종료 기록.
 * - readingTime은 전달받은 elapsedTime(초)으로 초기화한다.
 * - startPage/endPage는 조회한 책의 currentPage로 초기화한다.
 * - 저장 성공 응답을 받은 뒤에만 status가 success가 된다.
 */
export function useReadingEnd(bookId: number | null, elapsedTime: number) {
  const { data, error: loadError, isLoading: isBookLoading, reload } = useAsyncResource(
    () => readingApi.getBookDetail(bookId as number),
    [bookId],
    { enabled: bookId !== null },
  );
  const book = data?.book ?? null;

  const [readingTime, setReadingTime] = useState(elapsedTime);
  const [startPage, setStartPage] = useState(0);
  const [endPage, setEndPage] = useState(0);
  const [photos, setPhotos] = useState<ReadingPhoto[]>([]);
  const [sentence, setSentence] = useState('');
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [result, setResult] = useState<ReadingRecordResult | null>(null);

  // 책 정보를 처음 받았을 때만 페이지 초기값을 설정한다 (사용자 수정값 보존).
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!book || initializedRef.current) return;
    initializedRef.current = true;
    setStartPage(book.currentPage);
    setEndPage(book.currentPage);
  }, [book]);

  const setPageRange = ({ startPage: s, endPage: e }: { startPage: number; endPage: number }) => {
    setStartPage(s);
    setEndPage(e);
  };

  const saveReadingRecord = async (): Promise<boolean> => {
    if (bookId === null || !book) return false;
    const rangeError = validatePageRange(startPage, endPage, book.totalPages);
    if (rangeError) {
      setSaveError(rangeError);
      setStatus('error');
      return false;
    }
    if (readingTime <= 0) {
      setSaveError('독서 시간을 확인해주세요.');
      setStatus('error');
      return false;
    }
    setStatus('saving');
    setSaveError(null);
    try {
      const saved = await readingApi.saveReadingRecord({
        bookId,
        readingTime,
        startPage,
        endPage,
        sentence: sentence.trim() || undefined,
        photos,
      });
      setResult(saved);
      setStatus('success');
      return true;
    } catch (e) {
      setSaveError(toAppError(e).message);
      setStatus('error');
      return false;
    }
  };

  return {
    book,
    readingTime,
    startPage,
    endPage,
    photos,
    sentence,
    status,
    isLoading: status === 'saving',
    isBookLoading,
    loadError,
    saveError,
    result,
    setReadingTime,
    setStartPage,
    setEndPage,
    setPageRange,
    setPhotos,
    setSentence,
    saveReadingRecord,
    reload,
  };
}
