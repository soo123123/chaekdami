import { useCallback, useEffect, useRef, useState } from 'react';
import { toAppError, type AppError } from '../../utils/apiError';

type Options = {
  /** false면 마운트 시 자동 조회하지 않는다 (예: 필수 파라미터 누락) */
  enabled?: boolean;
};

/**
 * 서버 데이터 조회 공용 Hook.
 * 로딩/성공/오류 상태를 관리하고, 언마운트 이후의 상태 갱신과 오래된 응답 반영을 막는다.
 */
export function useAsyncResource<T>(loader: () => Promise<T>, deps: unknown[], { enabled = true }: Options = {}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);
  const loaderRef = useRef(loader);

  // 렌더 중 ref를 변경하지 않도록(React Compiler 규칙) effect에서 최신 loader를 보관한다.
  // 아래 조회 effect보다 먼저 선언되어 있어 항상 최신 loader로 조회한다.
  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await loaderRef.current();
      if (mountedRef.current && requestId === requestIdRef.current) setData(result);
    } catch (e) {
      if (mountedRef.current && requestId === requestIdRef.current) setError(toAppError(e));
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, reload, ...deps]);

  return { data, setData, error, isLoading, reload };
}
