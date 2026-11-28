import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { rankingApi } from '@/features/fe1/api/rankingApi';
import type { RankingType, WeeklyRanking } from '../../types/ranking';
import { kstToday } from '../../utils/format';
import { useAsyncResource } from '../common/useAsyncResource';

/** 받은 순위의 주(한국 날짜 월~일)가 이미 끝났으면 true (TODO-44) */
export function isPastWeek(ranking: WeeklyRanking | null, today = kstToday()): boolean {
  return !!ranking && ranking.weekEndDate < today;
}

/**
 * 주간 랭킹 조회 + 랭킹 종류 선택.
 * - 종류마다 조회 상태를 따로 두어, 늦게 온 응답이 다른 종류의 화면을 덮어쓰지 않는다.
 * - 이미 보여 준 순위가 있으면 다시 불러오는 동안이나 실패했을 때 그대로 둔다.
 * - 화면에 다시 들어오면 다시 조회한다. 앱으로 돌아왔을 때는 받은 순위의 주가 끝났을 때만 다시 조회한다 (TODO-44).
 *   다시 조회가 실패해 지난주 순위가 남으면 화면이 `isPastWeek`로 안내한다.
 */
export function useWeeklyRanking(initialType: RankingType) {
  const [type, setType] = useState<RankingType>(initialType);
  const readingTime = useAsyncResource(() => rankingApi.getWeeklyRanking('readingTime'), [], { enabled: type === 'readingTime' });
  const experience = useAsyncResource(() => rankingApi.getWeeklyRanking('experience'), [], { enabled: type === 'experience' });
  const current = type === 'readingTime' ? readingTime : experience;

  // 포커스·앱 복귀 콜백이 종류에 따라 바뀌지 않도록 최신 값을 ref로 읽는다.
  const latestRef = useRef(current);
  useEffect(() => {
    latestRef.current = current;
  });

  const isFirstFocusRef = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
      } else {
        void latestRef.current.reload();
      }
      const subscription = AppState.addEventListener('change', state => {
        if (state === 'active' && isPastWeek(latestRef.current.data)) void latestRef.current.reload();
      });
      return () => subscription.remove();
    }, []),
  );

  // 당겨서 새로고침: 사용자가 당겼을 때만 표시한다 (포커스·앱 복귀 조회는 표시하지 않음).
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await latestRef.current.reload();
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return {
    type,
    setType,
    ranking: current.data,
    error: current.data ? null : current.error,
    isPastWeek: isPastWeek(current.data),
    isRefreshing,
    refresh,
    reload: current.reload,
  };
}
