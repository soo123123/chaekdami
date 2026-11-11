import { useEffect, useRef, useState } from 'react';
import { readingApi } from '@/features/fe1/api/readingApi';
import type { ReadingPhoto, ReadingRecordResult } from '../../types/reading';
import { toAppError } from '../../utils/apiError';
import { validatePageRange } from '../../utils/validation';
import { useAsyncResource } from '../common/useAsyncResource';

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

/** 저장 결과. 실패 시 화면에 띄울 안내 문구를 함께 돌려준다. */
export type SaveResult = ({ ok: true } & ReadingRecordResult) | { ok: false; message: string };

/**
 * 독서 종료 기록.
 * - readingTime은 전달받은 elapsedTime(초)으로 초기화한다.
 * - startPage/endPage는 조회한 책의 currentPage로 초기화한다.
 *   완독한 책을 다시 읽는 경우(새 회차)는 0쪽부터 시작한다.
 * - 저장 성공 응답을 받은 뒤에만 status가 success가 된다.
 * - 책 사진(1장 이상)과 인상 깊었던 문장은 필수다.
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
    const startFrom = book.status === 'COMPLETED' ? 0 : book.currentPage;
    setStartPage(startFrom);
    setEndPage(startFrom);
  }, [book]);

  const setPageRange = ({ startPage: s, endPage: e }: { startPage: number; endPage: number }) => {
    setStartPage(s);
    setEndPage(e);
  };

  const saveReadingRecord = async (): Promise<SaveResult> => {
    if (bookId === null || !book) return { ok: false, message: '기록할 책 정보가 없어요.' };
    // 입력값 오류는 'idle'로 두어 '다시 시도하기'(서버 오류용)가 뜨지 않게 한다.
    const fail = (message: string, status: SaveStatus = 'idle'): SaveResult => {
      setSaveError(message);
      setStatus(status);
      return { ok: false, message };
    };
    const rangeError = validatePageRange(startPage, endPage, book.totalPages);
    if (rangeError) return fail(rangeError);
    if (readingTime <= 0) return fail('독서 시간을 확인해주세요.');
    if (photos.length === 0) return fail('책 사진을 1장 이상 첨부해주세요.');
    if (!sentence.trim()) return fail('인상 깊었던 문장을 입력해주세요.');

    setStatus('saving');
    setSaveError(null);
    try {
      const saved = await readingApi.saveReadingRecord({
        bookId,
        readingTime,
        startPage,
        endPage,
        sentence: sentence.trim(),
        photos,
      });
      setResult(saved);
      setStatus('success');
      return { ok: true, ...saved };
    } catch (e) {
      return fail(toAppError(e).message, 'error');
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
