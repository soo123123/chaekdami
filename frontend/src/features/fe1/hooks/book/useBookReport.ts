import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getReadingReview } from '@/features/fe2/api/reviewApi';

/**
 * 책 상세의 독후감 버튼 상태 (FE2 독후감 API 사용).
 * - 완독한 회차일 때만 서버에 독후감 유무를 묻는다.
 * - 독후감 작성·상세에서 돌아오면 다시 조회해 '작성하기' → '내 독후감 보기'로 바뀌게 한다.
 */
export function useBookReport(readingRecordId: number | null, isCompleted: boolean) {
  const [hasReport, setHasReport] = useState(false);
  const [canWriteOnServer, setCanWriteOnServer] = useState(true);
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    if (readingRecordId === null || !isCompleted) {
      setHasReport(false);
      setCanWriteOnServer(true);
      return;
    }
    try {
      const response = await getReadingReview(readingRecordId);
      if (requestId !== requestIdRef.current) return;
      setHasReport(!!response.bookReport);
      setCanWriteOnServer(response.canWrite);
    } catch {
      // 조회 실패 시에도 완독 상태면 작성 버튼은 열어 둔다 (작성 화면에서 다시 조회한다)
      if (requestId !== requestIdRef.current) return;
      setHasReport(false);
      setCanWriteOnServer(true);
    }
  }, [readingRecordId, isCompleted]);

  useEffect(() => {
    void load();
  }, [load]);

  // 독후감 화면에서 돌아올 때 다시 조회 (첫 포커스는 위 effect가 처리)
  const isFirstFocusRef = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }
      void load();
    }, [load]),
  );

  return { hasReport, canWrite: isCompleted && canWriteOnServer };
}
