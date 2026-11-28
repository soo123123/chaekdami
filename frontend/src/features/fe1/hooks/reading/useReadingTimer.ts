import { useCallback, useEffect, useRef, useState } from 'react';
import { MAX_READING_SECONDS } from '../../constants/config';

const TICK_MS = 250;
const MAX_MS = MAX_READING_SECONDS * 1000;

/** 기기에 보관하거나 되살릴 때 쓰는 타이머 상태 */
export type TimerSnapshot = { accumulatedMs: number; runningSince: number | null };

/**
 * 독서 타이머.
 *
 * 경과 시간을 렌더링/interval 횟수로 누적하지 않고 기준 시각으로 계산한다.
 *   elapsed = accumulatedMs + (runningSince ? now - runningSince : 0)
 * - 앱이 백그라운드에 있던 시간도 실행 중이었다면 정확히 반영된다.
 * - 일시정지 중에는 runningSince가 null이므로 시간이 증가하지 않는다.
 * - 재개 시 accumulatedMs에서 이어서 측정한다.
 * - 리렌더링으로 값이 초기화되지 않도록 ref에 보관한다.
 * - 2시간(MAX_READING_SECONDS)에 닿으면 멈추고 더 이상 재개하지 않는다 (ISSUE-LIMIT-5). 서버가 2시간이 넘는 기록을 거부한다.
 */
export function useReadingTimer() {
  const accumulatedMsRef = useRef(0);
  const runningSinceRef = useRef<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // 초
  const [hasReachedLimit, setHasReachedLimit] = useState(false);

  const computeElapsedMs = useCallback(() => {
    const since = runningSinceRef.current;
    return Math.min(accumulatedMsRef.current + (since !== null ? Date.now() - since : 0), MAX_MS);
  }, []);

  const pauseTimer = useCallback(() => {
    if (runningSinceRef.current === null) return;
    accumulatedMsRef.current = computeElapsedMs();
    runningSinceRef.current = null;
    setIsRunning(false);
    setElapsedTime(Math.floor(accumulatedMsRef.current / 1000));
    if (accumulatedMsRef.current >= MAX_MS) setHasReachedLimit(true);
  }, [computeElapsedMs]);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      const elapsedMs = computeElapsedMs();
      if (elapsedMs >= MAX_MS) pauseTimer();
      else setElapsedTime(Math.floor(elapsedMs / 1000));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [isRunning, computeElapsedMs, pauseTimer]);

  const startTimer = useCallback(() => {
    if (runningSinceRef.current !== null) return;
    if (accumulatedMsRef.current >= MAX_MS) {
      setHasReachedLimit(true);
      return;
    }
    runningSinceRef.current = Date.now();
    setIsRunning(true);
  }, []);

  /** 실행 중이면 멈추고, 최종 경과 시간(초)을 반환한다. */
  const finishReading = useCallback((): number => {
    pauseTimer();
    return Math.floor(accumulatedMsRef.current / 1000);
  }, [pauseTimer]);

  const resetTimer = useCallback(() => {
    accumulatedMsRef.current = 0;
    runningSinceRef.current = null;
    setIsRunning(false);
    setElapsedTime(0);
    setHasReachedLimit(false);
  }, []);

  /** 보관해 둔 시간으로 되살린다. 일시정지 상태로 두며, 사용자가 '이어서 읽기'를 눌러야 재개된다. */
  const restoreTimer = useCallback((seconds: number) => {
    accumulatedMsRef.current = Math.min(Math.max(0, seconds) * 1000, MAX_MS);
    runningSinceRef.current = null;
    setIsRunning(false);
    setElapsedTime(Math.floor(accumulatedMsRef.current / 1000));
    setHasReachedLimit(accumulatedMsRef.current >= MAX_MS);
  }, []);

  const getSnapshot = useCallback(
    (): TimerSnapshot => ({ accumulatedMs: accumulatedMsRef.current, runningSince: runningSinceRef.current }),
    [],
  );

  return { elapsedTime, isRunning, hasReachedLimit, startTimer, pauseTimer, finishReading, resetTimer, restoreTimer, getSnapshot };
}
