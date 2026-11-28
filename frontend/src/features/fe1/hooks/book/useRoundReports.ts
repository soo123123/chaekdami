import { useCallback, useEffect, useRef, useState } from 'react';
import { getReadingReview } from '@/features/fe2/api/reviewApi';
import type { ReadingRound } from '../../types/reading';

export type RoundReportState =
  | { status: 'loading' }
  | { status: 'ok'; hasReport: boolean; canWrite: boolean }
  | { status: 'error' };

/**
 * 독후감 '모두 보기' 시트용: 완독한 회차마다 독후감 유무를 조회한다 (FE2 독후감 API).
 * - enabled(시트가 열렸을 때)일 때만 조회해 책 상세 진입 시 호출이 늘지 않게 한다.
 * - 회차별로 따로 조회해 하나가 실패해도 나머지는 보여준다.
 * - 읽는 중인 회차는 독후감을 쓸 수 없으므로 조회하지 않는다.
 */
export function useRoundReports(rounds: ReadingRound[], enabled: boolean) {
  const [states, setStates] = useState<Record<number, RoundReportState>>({});
  // 시트를 닫았다 열거나 회차 목록이 바뀌면 이전 응답을 버린다
  const generationRef = useRef(0);

  const loadOne = useCallback(async (readingRecordId: number, generation: number) => {
    setStates(prev => ({ ...prev, [readingRecordId]: { status: 'loading' } }));
    try {
      const response = await getReadingReview(readingRecordId);
      if (generation !== generationRef.current) return;
      setStates(prev => ({
        ...prev,
        [readingRecordId]: { status: 'ok', hasReport: !!response.bookReport, canWrite: response.canWrite },
      }));
    } catch {
      if (generation !== generationRef.current) return;
      setStates(prev => ({ ...prev, [readingRecordId]: { status: 'error' } }));
    }
  }, []);

  // 회차 목록이 같으면 다시 조회하지 않도록 ID 문자열로 비교한다
  const completedKey = rounds
    .filter(round => round.status === 'COMPLETED')
    .map(round => round.readingRecordId)
    .join(',');

  // 대상이 바뀌면 이전 결과를 비운다 (렌더 중에 맞춤). 조회는 아래 effect가 한다.
  const targetKey = `${enabled}|${completedKey}`;
  const [lastTargetKey, setLastTargetKey] = useState(targetKey);
  if (targetKey !== lastTargetKey) {
    setLastTargetKey(targetKey);
    setStates({});
  }

  useEffect(() => {
    const generation = ++generationRef.current;
    if (!enabled) return;
    const ids = completedKey ? completedKey.split(',').map(Number) : [];
    ids.forEach(id => void loadOne(id, generation));
  }, [enabled, completedKey, loadOne]);

  const retry = useCallback((readingRecordId: number) => {
    void loadOne(readingRecordId, generationRef.current);
  }, [loadOne]);

  return { states, retry };
}
