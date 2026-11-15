import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getReadingReview, type ReadingReviewResponse } from '../api/reviewApi';
import { getQuests, getRewardStatus } from '../api/rewardApi';
import type {
  CompleteQuest,
  ReadingCompleteData,
  ReadingCompleteParams,
} from '../types/readingComplete';

/* ------------------------------------------------------------------ */
/* 라우트 파라미터                                                       */
/* ------------------------------------------------------------------ */

type RawParams = {
  readingRecordId?: string | string[];
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
  const keys = [raw.readingRecordId, raw.bookId, raw.durationMinutes, raw.pagesRead, raw.round, raw.isCompleted, raw.remainingPages]
    .map(value => first(value) ?? '')
    .join('|');
  // 같은 파라미터면 같은 객체를 돌려줘 아래 useMemo·useEffect가 매 렌더 다시 돌지 않게 한다
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => ({
    readingRecordId: readNumber(raw.readingRecordId),
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
  gainedExp: 120,
  currentExp: 620,
  requiredExp: 1200,
  durationMinutes: 80,
  goalMinutes: 90,
  pagesRead: 60,
  goalPages: 60,
  focusPercent: 94,
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

function buildData(
  params: ReadingCompleteParams,
  reward: RewardStatusResponse | null,
  questList: QuestResponse[] | null,
  readingReview: ReadingReviewResponse | null,
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

  const quests = questList ? questsFromApi(questList) : exampleQuests(durationMinutes, pagesRead);
  if (!questList) exampleFields.push('quests');
  const completedQuests = quests.filter(quest => quest.completed);

  const gainedExp = questList
    ? completedQuests.reduce(
        (sum, quest) => sum + (questList.find(item => item.id === quest.id)?.rewardXp ?? 0),
        0,
      )
    : pick(null, EXAMPLE.gainedExp, 'gainedExp');

  return {
    streak: { days: pick(reward?.dday, EXAMPLE.streakDays, 'streakDays'), delta: 1 },
    level: {
      level: pick(reward?.level, EXAMPLE.level, 'level'),
      gainedExp,
      currentExp: pick(reward?.xp, EXAMPLE.currentExp, 'currentExp'),
      requiredExp: pick(reward?.requiredXp, EXAMPLE.requiredExp, 'requiredExp'),
    },
    record: {
      durationMinutes,
      // 목표·집중도는 아직 전달 경로가 없어 예시 값을 쓴다
      goalMinutes: pick(null, EXAMPLE.goalMinutes, 'goalMinutes'),
      pagesRead,
      goalPages: pick(null, EXAMPLE.goalPages, 'goalPages'),
      focusPercent: pick(null, EXAMPLE.focusPercent, 'focusPercent'),
      focusModeUsed: true,
    },
    quests,
    rewardCoin: completedQuests.reduce((sum, quest) => sum + quest.rewardCoin, 0),
    review: {
      // FE1 저장 결과(완독 여부)와 서버 canWrite를 모두 만족해야 활성화한다.
      // 값이 없는 쪽은 막지 않는다 (예: 파라미터 없이 연 미리보기, 서버 응답 전).
      canWrite: (params.isCompleted ?? true) && (readingReview?.canWrite ?? true),
      hasReport: !!readingReview?.bookReport,
      remainingPages: params.remainingPages,
    },
    exampleFields,
  };
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

/**
 * 독서 완료 화면 데이터.
 * - 오늘의 독서 기록: 독서 종료(FE1)에서 넘긴 파라미터
 * - D-day·레벨: getRewardStatus(), 퀘스트·보상: getQuests()
 * - 값이 없거나 API가 실패하면 UI 시안 수치로 채운다 (exampleFields에 기록).
 *   API 응답을 기다리는 동안에도 화면은 바로 그린다.
 */
export function useReadingComplete() {
  const params = useReadingCompleteParams();
  const [reward, setReward] = useState<RewardStatusResponse | null>(null);
  const [questList, setQuestList] = useState<QuestResponse[] | null>(null);
  const [readingReview, setReadingReview] = useState<ReadingReviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
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
    return () => {
      active = false;
    };
  }, []);

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
    () => buildData(params, reward, questList, readingReview),
    [params, reward, questList, readingReview],
  );

  useEffect(() => {
    if (__DEV__ && !isLoading && data.exampleFields.length > 0) {
      console.info('[ReadingComplete] 예시 값 사용:', data.exampleFields.join(', '));
    }
  }, [isLoading, data.exampleFields]);

  return { params, data, isLoading };
}
