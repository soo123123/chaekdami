import { useCallback, useEffect, useRef, useState } from 'react';
import { photoVerifyApi } from '@/features/fe1/api/photoVerifyApi';
import { readingApi } from '@/features/fe1/api/readingApi';
import { PHOTO_VERIFY_TIMEOUT_MS } from '../../constants/config';
import type { ReadingPhoto, ReadingRecordResult } from '../../types/reading';
import { toAppError } from '../../utils/apiError';
import { validatePageRange } from '../../utils/validation';
import { useAsyncResource } from '../common/useAsyncResource';

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

/** 검증에서 책 페이지로 확인되지 않았을 때 (서버가 사유를 주지 않은 경우) */
const PHOTO_REJECTED_MESSAGE = '책 페이지를 확인할 수 없어요. 다시 찍어주세요.';
/** 네트워크·서버 문제로 검증 자체를 못 했을 때 */
const PHOTO_ERROR_MESSAGE = '사진을 확인하지 못했어요. 다시 시도해주세요.';
/** 정해진 시간 안에 검증 결과가 오지 않았을 때 */
const PHOTO_TIMEOUT_MESSAGE = '사진 확인이 오래 걸리고 있어요. 다시 찍어주세요.';

/** 저장 결과. 실패 시 화면에 띄울 안내 문구를 함께 돌려준다. */
export type SaveResult = ({ ok: true } & ReadingRecordResult) | { ok: false; message: string };

/**
 * 독서 종료 기록.
 * - readingTime은 전달받은 elapsedTime(초)으로 초기화한다.
 * - startPage/endPage는 조회한 책의 currentPage로 초기화한다.
 *   완독한 책을 다시 읽는 경우(새 회차)는 0쪽부터 시작한다.
 * - 저장 성공 응답을 받은 뒤에만 status가 success가 된다.
 * - 인상 깊었던 문장은 필수다.
 * - 책 사진 인증은 선택(1장)이다. 첨부하면 바로 가장 최근 회차로 서버 인증을 요청하고,
 *   통과하면 인증 번호만 저장 요청에 싣는다(세션 저장 요청에는 이미지를 싣지 않는다).
 *   통과하지 못하면 사진을 지우고 다시 찍도록 안내한다.
 * - 검증은 PHOTO_VERIFY_TIMEOUT_MS 안에 끝나지 않으면 실패로 처리한다.
 * - 검증 중에는 저장하지 않는다(화면에서 저장 버튼을 비활성화한다).
 */
export function useReadingEnd(bookId: number | null, elapsedTime: number) {
  const { data, error: loadError, isLoading: isBookLoading, reload } = useAsyncResource(
    () => readingApi.getBookDetail(bookId as number),
    [bookId],
    { enabled: bookId !== null },
  );
  const book = data?.book ?? null;
  /** 사진 인증을 보낼 회차: 책의 가장 최근 회차. 완독한 책을 다시 읽는 첫 세션이면 새 회차가 저장 때 생겨서 이전 회차로 인증된다(서버가 세션에 연결하므로 보상에는 영향 없음). */
  const readingRecordId = data?.currentRound?.readingRecordId ?? null;

  const [readingTime, setReadingTime] = useState(elapsedTime);
  const [startPage, setStartPage] = useState(0);
  const [endPage, setEndPage] = useState(0);
  const [photo, setPhoto] = useState<ReadingPhoto | null>(null);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);
  /** 이 화면에서 사진을 한 번이라도 첨부했는지 (검증 실패로 지워졌어도 true). 사진 인증 안내 팝업 노출 판단용. */
  const [hasTriedPhoto, setHasTriedPhoto] = useState(false);
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

  // 진행 중인 사진 검증. 사진을 지우거나 새로 첨부하거나 화면을 벗어나면 취소하고, 늦게 온 결과는 버린다.
  const verifyRef = useRef<AbortController | null>(null);
  const cancelVerify = useCallback(() => {
    verifyRef.current?.abort();
    verifyRef.current = null;
  }, []);
  useEffect(() => cancelVerify, [cancelVerify]);

  /** 사진을 첨부하고 바로 검증한다. 이미 사진이 있으면 새 사진으로 바꾼다. */
  const attachPhoto = async (uri: string) => {
    if (bookId === null) return;
    cancelVerify();
    if (readingRecordId === null) {
      // 회차 정보가 없으면(책 정보를 아직 못 받음 등) 인증할 수 없다.
      setHasTriedPhoto(true);
      setPhoto(null);
      setPhotoNotice(PHOTO_ERROR_MESSAGE);
      return;
    }
    const controller = new AbortController();
    verifyRef.current = controller;
    setHasTriedPhoto(true);
    setPhotoNotice(null);
    setPhoto({ uri, status: 'verifying' });
    // 응답이 오지 않으면 저장 버튼이 계속 비활성화되므로 시간 제한을 둔다.
    // 사진 축소 단계처럼 취소 신호를 받지 못하는 작업이 멈춰 있어도 끝낼 수 있게, 결과를 기다리지 않고 바로 실패 처리한다.
    const timer = setTimeout(() => {
      if (verifyRef.current !== controller) return;
      verifyRef.current = null;
      controller.abort();
      setPhoto(null);
      setPhotoNotice(PHOTO_TIMEOUT_MESSAGE);
    }, PHOTO_VERIFY_TIMEOUT_MS);
    try {
      const verification = await photoVerifyApi.verify(readingRecordId, uri, controller.signal);
      if (verifyRef.current !== controller) return; // 그사이 지워졌거나 다른 사진으로 바뀜
      verifyRef.current = null;
      if (verification.verified) {
        setPhoto({ uri, status: 'verified', verificationId: verification.verificationId });
      } else {
        setPhoto(null);
        setPhotoNotice(verification.reason || PHOTO_REJECTED_MESSAGE);
      }
    } catch {
      if (verifyRef.current !== controller) return;
      verifyRef.current = null;
      setPhoto(null);
      setPhotoNotice(PHOTO_ERROR_MESSAGE);
    } finally {
      clearTimeout(timer);
    }
  };

  const removePhoto = () => {
    cancelVerify();
    setPhoto(null);
    setPhotoNotice(null);
  };

  const setPageRange = ({ startPage: s, endPage: e }: { startPage: number; endPage: number }) => {
    setStartPage(s);
    setEndPage(e);
  };

  /** 저장 전 입력값 확인. 문제가 있으면 안내 문구를 돌려준다. */
  const getInputError = (): string | null => {
    if (bookId === null || !book) return '기록할 책 정보가 없어요.';
    const rangeError = validatePageRange(startPage, endPage, book.totalPages);
    if (rangeError) return rangeError;
    if (readingTime <= 0) return '독서 시간을 확인해주세요.';
    if (!sentence.trim()) return '인상 깊었던 문장을 입력해주세요.';
    return null;
  };

  // 입력값 오류는 'idle'로 두어 '다시 시도하기'(서버 오류용)가 뜨지 않게 한다.
  const fail = (message: string, nextStatus: SaveStatus = 'idle'): SaveResult => {
    setSaveError(message);
    setStatus(nextStatus);
    return { ok: false, message };
  };

  /**
   * 저장 버튼을 눌렀을 때 팝업 등을 띄우기 전에 입력값을 먼저 확인한다.
   * 문제가 있으면 화면 오류 문구를 설정하고 안내 문구를 돌려준다. 없으면 null.
   */
  const validateInputs = (): string | null => {
    const inputError = getInputError();
    if (inputError) fail(inputError);
    return inputError;
  };

  const saveReadingRecord = async (): Promise<SaveResult> => {
    const inputError = getInputError();
    if (inputError) return fail(inputError);
    if (bookId === null) return fail('기록할 책 정보가 없어요.'); // 위에서 걸러지지만 타입 좁히기용

    setStatus('saving');
    setSaveError(null);
    try {
      const saved = await readingApi.saveReadingRecord({
        bookId,
        readingTime,
        startPage,
        endPage,
        sentence: sentence.trim(),
        // 저장 시점에 통과한 사진만 인증으로 인정한다 (검증 중이면 인증 없이 저장).
        photoVerificationId: photo?.status === 'verified' ? photo.verificationId : undefined,
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
    photo,
    photoNotice,
    hasTriedPhoto,
    isPhotoVerifying: photo?.status === 'verifying',
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
    attachPhoto,
    removePhoto,
    setSentence,
    validateInputs,
    saveReadingRecord,
    reload,
  };
}
