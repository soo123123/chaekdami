import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getReadingReview, type ReadingReviewResponse } from '../api/reviewApi';
import {
  claimReadingSessionReward,
  getQuests,
  getRewardStatus,
  type ReadingSessionRewardResult,
} from '../api/rewardApi';
import type {
  CompleteQuest,
  CompleteRewardState,
  ReadingCompleteData,
  ReadingCompleteParams,
} from '../types/readingComplete';

/* ------------------------------------------------------------------ */
/* 라우트 파라미터                                                       */
/* ------------------------------------------------------------------ */

type RawParams = {
  readingRecordId?: string | string[];
  sessionId?: string | string[];
  bookId?: string | string[];
  durationMinutes?: string | string[];
  pagesRead?: string | string[];
  round?: string | string[];
  isCompleted?: string | string[];
  remainingPages?: string | string[];
};

function first(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function readNumber(value?: string | string[]): number | null {
  const raw = first(value);
  if (raw === undefined || raw.trim() === '') return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function useReadingCompleteParams(): ReadingCompleteParams {
  const raw = useLocalSearchParams<RawParams>();
  const keys = [raw.readingRecordId, raw.sessionId, raw.bookId, raw.durationMinutes, raw.pagesRead, raw.round, raw.isCompleted, raw.remainingPages]
    .map(value => first(value) ?? '')
    .join('|');
  // 같은 파라미터면 같은 객체를 돌려줘 아래 useMemo·useEffect가 매 렌더 다시 돌지 않게 한다
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => ({
    readingRecordId: readNumber(raw.readingRecordId),
    sessionId: readNumber(raw.sessionId),
    bookId: readNumber(raw.bookId),
    durationMinutes: readNumber(raw.durationMinutes),
    pagesRead: readNumber(raw.pagesRead),
    round: readNumber(raw.round),
    isCompleted: first(raw.isCompleted) === undefined ? null : first(raw.isCompleted) === '1',
    remainingPages: readNumber(raw.remainingPages),
  }), [keys]);
}

/* ------------------------------------------------------------------ */
/* 예시 값 (UI 시안 수치). 파라미터·API 값이 없을 때만 쓴다.                 */
/* ------------------------------------------------------------------ */

const EXAMPLE = {
  streakDays: 13,
  level: 6,
  currentExp: 620,
  requiredExp: 1200,
  durationMinutes: 80,
  goalMinutes: 90,
  pagesRead: 60,
  goalPages: 60,
} as const;

/* ------------------------------------------------------------------ */
/* API 응답 (백엔드 명세 확정 전. RewardScreen·QuestScreen과 같은 필드명 사용) */
/* ------------------------------------------------------------------ */

type RewardStatusResponse = {
  level?: number;
  xp?: number;
  requiredXp?: number;
  currency?: number;
  dday?: number;
};

type QuestResponse = {
  id: number;
  title: string;
  description?: string;
  progress?: number;
  target?: number;
  rewardXp?: number;
  rewardCurrency?: number;
  completed?: boolean;
  type?: string;
};

/** 완료 화면에 보여줄 퀘스트 수 (시안 기준 3개) */
const QUEST_LIMIT = 3;

function questsFromApi(list: QuestResponse[]): CompleteQuest[] {
  // 오늘의(일일) 퀘스트를 먼저 보여준다
  const daily = list.filter(quest => quest.type === 'DDAY');
  const source = daily.length > 0 ? daily : list;
  return source.slice(0, QUEST_LIMIT).map(quest => ({
    id: quest.id,
    title: quest.title,
    description: quest.description ?? quest.title,
    completed:
      quest.completed ??
      (quest.target !== undefined && (quest.progress ?? 0) >= quest.target),
    rewardCoin: quest.rewardCurrency ?? 0,
  }));
}

/** API가 없을 때: 이번 독서 기록으로 달성 여부를 계산한 예시 퀘스트 */
function exampleQuests(durationMinutes: number, pagesRead: number): CompleteQuest[] {
  return [
    { id: 1, title: '30분 이상 독서하기', description: '30분 이상 독서하기', completed: durationMinutes >= 30, rewardCoin: 100 },
    // 독서 기록을 저장해야 이 화면에 오므로 항상 달성
    { id: 2, title: '매일 독서 기록 남기기', description: '독서 기록을 남겨보세요', completed: true, rewardCoin: 100 },
    { id: 3, title: '오늘 50페이지 읽기', description: '50페이지 이상 읽기', completed: pagesRead >= 50, rewardCoin: 150 },
  ];
}

/** 보상 응답 + 오늘의 퀘스트 목록으로 완료 화면에 보여줄 퀘스트를 만든다 */
function questsFromClaim(claim: ReadingSessionRewardResult, list: QuestResponse[] | null): CompleteQuest[] {
  const earned = new Map(claim.completedQuests.map(quest => [quest.userQuestId, quest]));
  if (list) {
    return questsFromApi(list).map(quest =>
      earned.has(quest.id) ? { ...quest, completed: true, rewardCoin: earned.get(quest.id)!.rewardCurrency } : quest,
    );
  }
  // 퀘스트 목록 조회가 실패하면 이번에 달성한 퀘스트만 보여준다
  return claim.completedQuests.slice(0, QUEST_LIMIT).map(quest => ({
    id: quest.userQuestId,
    title: quest.title ?? '오늘의 퀘스트',
    description: quest.title ?? '오늘의 퀘스트',
    completed: true,
    rewardCoin: quest.rewardCurrency,
  }));
}

function buildData(
  params: ReadingCompleteParams,
  reward: RewardStatusResponse | null,
  questList: QuestResponse[] | null,
  readingReview: ReadingReviewResponse | null,
  claim: ReadingSessionRewardResult | null,
  rewardState: CompleteRewardState,
): ReadingCompleteData {
  const exampleFields: string[] = [];
  const pick = <T,>(value: T | null | undefined, fallback: T, field: string): T => {
    if (value === null || value === undefined) {
      exampleFields.push(field);
      return fallback;
    }
    return value;
  };

  const durationMinutes = pick(params.durationMinutes, EXAMPLE.durationMinutes, 'durationMinutes');
  const pagesRead = pick(params.pagesRead, EXAMPLE.pagesRead, 'pagesRead');

  const record = {
    durationMinutes,
    // 목표는 아직 전달 경로가 없어 예시 값을 쓴다
    goalMinutes: pick(null, EXAMPLE.goalMinutes, 'goalMinutes'),
    pagesRead,
    goalPages: pick(null, EXAMPLE.goalPages, 'goalPages'),
  };
  const review = {
    // FE1 저장 결과(완독 여부)와 서버 canWrite를 모두 만족해야 활성화한다.
    // 값이 없는 쪽은 막지 않는다 (예: 파라미터 없이 연 미리보기, 서버 응답 전).
    canWrite: (params.isCompleted ?? true) && (readingReview?.canWrite ?? true),
    hasReport: !!readingReview?.bookReport,
    remainingPages: params.remainingPages,
  };

  // 세션 번호가 있는 경우: 보상 API 응답 값만 쓴다 (예시 값으로 채우지 않음)
  if (params.sessionId !== null) {
    const earnedQuestExp = claim?.completedQuests.reduce((sum, quest) => sum + quest.rewardExperience, 0) ?? 0;
    const earnedQuestCoin = claim?.completedQuests.reduce((sum, quest) => sum + quest.rewardCurrency, 0) ?? 0;
    return {
      streak: { days: claim?.streak.currentStreak ?? 0, delta: 0 },
      level: {
        level: claim?.level ?? 1,
        gainedExp: claim ? claim.reading.experience + claim.photoBonus.experience + earnedQuestExp : 0,
        currentExp: claim?.currentExperience ?? 0,
        requiredExp: Math.max(1, claim?.nextLevelExperience ?? 1),
        leveledUp: claim?.leveledUp ?? false,
        photoBonusExp: claim?.photoBonus.granted ? claim.photoBonus.experience : 0,
        boosted: claim?.reading.boosted ?? false,
      },
      record,
      quests: claim ? questsFromClaim(claim, questList) : questList ? questsFromApi(questList) : [],
      rewardCoin: claim ? earnedQuestCoin + claim.promotionReward : 0,
      rewardState,
      review,
      exampleFields,
    };
  }

  // 세션 번호가 없는 경우(미리보기 등): 조회 값, 없으면 UI 시안 수치
  const quests = questList ? questsFromApi(questList) : exampleQuests(durationMinutes, pagesRead);
  if (!questList) exampleFields.push('quests');
  const completedQuests = quests.filter(quest => quest.completed);

  return {
    streak: { days: pick(reward?.dday, EXAMPLE.streakDays, 'streakDays'), delta: 0 },
    level: {
      level: pick(reward?.level, EXAMPLE.level, 'level'),
      // 보상을 받지 않았으므로 이번 독서로 얻은 경험치는 없다
      gainedExp: 0,
      currentExp: pick(reward?.xp, EXAMPLE.currentExp, 'currentExp'),
      requiredExp: pick(reward?.requiredXp, EXAMPLE.requiredExp, 'requiredExp'),
      leveledUp: false,
      photoBonusExp: 0,
      boosted: false,
    },
    record,
    quests,
    rewardCoin: completedQuests.reduce((sum, quest) => sum + quest.rewardCoin, 0),
    rewardState,
    review,
    exampleFields,
  };
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

/**
 * 독서 완료 화면 데이터.
 * - 오늘의 독서 기록: 독서 종료(FE1)에서 넘긴 파라미터
 * - 세션 번호(sessionId)가 있으면: 진입 시 독서 완료 보상 API를 한 번 호출해 그 응답으로
 *   D-day·레벨·획득 경험치·퀘스트·코인을 보여준다. 실패하면 retryReward로 다시 요청한다.
 *   같은 세션을 다시 열면 서버가 처음 받은 내역을 돌려준다 (rewardState = alreadyGranted).
 * - 세션 번호가 없으면(미리보기 등): getRewardStatus(), getQuests() 조회 값, 없으면 UI 시안 수치 (exampleFields에 기록).
 * - API 응답을 기다리는 동안에도 화면은 바로 그린다.
 */
export function useReadingComplete() {
  const params = useReadingCompleteParams();
  const sessionId = params.sessionId;
  const [reward, setReward] = useState<RewardStatusResponse | null>(null);
  const [questList, setQuestList] = useState<QuestResponse[] | null>(null);
  const [claim, setClaim] = useState<ReadingSessionRewardResult | null>(null);
  const [rewardState, setRewardState] = useState<CompleteRewardState>(sessionId !== null ? 'loading' : 'none');
  const [readingReview, setReadingReview] = useState<ReadingReviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);
  // 같은 세션으로 보상 요청을 두 번 보내지 않게 한다 (서버도 중복 지급은 막지만 요청 자체를 줄인다)
  const requestedSessionRef = useRef<number | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 보상을 받은 뒤 퀘스트 목록을 조회한다 (보상 처리로 바뀐 진행도를 보여주기 위해 순서대로)
  const requestReward = useCallback(async (id: number) => {
    setRewardState('loading');
    try {
      const result = await claimReadingSessionReward(id);
      if (!mountedRef.current) return;
      setClaim(result);
      setRewardState(result.baseGranted ? 'granted' : 'alreadyGranted');
    } catch (error) {
      console.warn('[ReadingComplete] 독서 완료 보상 요청 실패:', error);
      if (mountedRef.current) setRewardState('error');
    }
    try {
      const list = await getQuests();
      if (mountedRef.current && Array.isArray(list)) setQuestList(list as QuestResponse[]);
    } catch (error) {
      console.warn('[ReadingComplete] 퀘스트 조회 실패:', error);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    if (sessionId !== null) {
      if (requestedSessionRef.current !== sessionId) {
        requestedSessionRef.current = sessionId;
        void requestReward(sessionId);
      }
    } else {
      setRewardState('none');
      (async () => {
        const [rewardResult, questResult] = await Promise.allSettled([getRewardStatus(), getQuests()]);
        if (!active) return;
        if (rewardResult.status === 'fulfilled' && rewardResult.value && typeof rewardResult.value === 'object') {
          setReward(rewardResult.value as RewardStatusResponse);
        }
        if (questResult.status === 'fulfilled' && Array.isArray(questResult.value)) {
          setQuestList(questResult.value as QuestResponse[]);
        }
        setIsLoading(false);
      })();
    }
    return () => {
      active = false;
    };
  }, [sessionId, requestReward]);

  const retryReward = useCallback(() => {
    if (sessionId !== null) void requestReward(sessionId);
  }, [sessionId, requestReward]);

  // 이 회차의 독후감 상태 (완독 여부 canWrite, 이미 쓴 독후감).
  // 독후감을 쓰고 돌아왔을 때 '내 독후감 보기'로 바뀌도록 화면에 다시 들어올 때마다 조회한다.
  const readingRecordId = params.readingRecordId;
  useFocusEffect(
    useCallback(() => {
      if (readingRecordId === null) return undefined;
      let active = true;
      getReadingReview(readingRecordId)
        .then(response => {
          if (active) setReadingReview(response);
        })
        .catch(error => console.warn('[ReadingComplete] 독후감 상태 조회 실패:', error));
      return () => {
        active = false;
      };
    }, [readingRecordId]),
  );

  const data = useMemo(
    () => buildData(params, reward, questList, readingReview, claim, rewardState),
    [params, reward, questList, readingReview, claim, rewardState],
  );

  useEffect(() => {
    if (__DEV__ && !isLoading && data.exampleFields.length > 0) {
      console.info('[ReadingComplete] 예시 값 사용:', data.exampleFields.join(', '));
    }
  }, [isLoading, data.exampleFields]);

  return { params, data, isLoading, retryReward };
}
