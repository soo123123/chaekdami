import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { rankingApi } from '@/features/fe1/api/rankingApi';
import type { RankingType } from '../../types/ranking';
import { useAsyncResource } from '../common/useAsyncResource';

/**
 * 주간 랭킹 조회 + 랭킹 종류 선택.
 * - 종류마다 조회 상태를 따로 두어, 늦게 온 응답이 다른 종류의 화면을 덮어쓰지 않는다.
 * - 이미 보여 준 순위가 있으면 다시 불러오는 동안이나 실패했을 때 그대로 둔다.
 */
export function useWeeklyRanking(initialType: RankingType) {
  const [type, setType] = useState<RankingType>(initialType);
  const readingTime = useAsyncResource(() => rankingApi.getWeeklyRanking('readingTime'), [], { enabled: type === 'readingTime' });
  const experience = useAsyncResource(() => rankingApi.getWeeklyRanking('experience'), [], { enabled: type === 'experience' });
  const current = type === 'readingTime' ? readingTime : experience;

  // 다른 화면에 갔다가 돌아오면 지금 고른 랭킹을 다시 조회한다.
  // 종류 전환 때의 조회는 useAsyncResource가 하므로, 포커스 콜백이 종류에 따라 바뀌지 않도록 ref로 읽는다.
  const reloadRef = useRef(current.reload);
  useEffect(() => {
    reloadRef.current = current.reload;
  });
  const isFirstFocusRef = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }
      void reloadRef.current();
    }, []),
  );

  return {
    type,
    setType,
    ranking: current.data,
    error: current.data ? null : current.error,
    reload: current.reload,
  };
}
