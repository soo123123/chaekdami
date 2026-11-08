import { useCallback, useEffect, useRef, useState } from 'react';

const TICK_MS = 250;

/**
 * 독서 타이머.
 *
 * 경과 시간을 렌더링/interval 횟수로 누적하지 않고 기준 시각으로 계산한다.
 *   elapsed = accumulatedMs + (runningSince ? now - runningSince : 0)
 * - 앱이 백그라운드에 있던 시간도 실행 중이었다면 정확히 반영된다.
 * - 일시정지 중에는 runningSince가 null이므로 시간이 증가하지 않는다.
 * - 재개 시 accumulatedMs에서 이어서 측정한다.
 * - 리렌더링으로 값이 초기화되지 않도록 ref에 보관한다.
 */
export function useReadingTimer() {
  const accumulatedMsRef = useRef(0);
  const runningSinceRef = useRef<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // 초

  const computeElapsedMs = useCallback(() => {
    const since = runningSinceRef.current;
    return accumulatedMsRef.current + (since !== null ? Date.now() - since : 0);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setElapsedTime(Math.floor(computeElapsedMs() / 1000)), TICK_MS);
    return () => clearInterval(id);
  }, [isRunning, computeElapsedMs]);

  const startTimer = useCallback(() => {
    if (runningSinceRef.current !== null) return;
    runningSinceRef.current = Date.now();
    setIsRunning(true);
  }, []);

  const pauseTimer = useCallback(() => {
    const since = runningSinceRef.current;
    if (since === null) return;
    accumulatedMsRef.current += Date.now() - since;
    runningSinceRef.current = null;
    setIsRunning(false);
    setElapsedTime(Math.floor(accumulatedMsRef.current / 1000));
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
  }, []);

  return { elapsedTime, isRunning, startTimer, pauseTimer, finishReading, resetTimer };
}
