/** 독서 완료 화면(ReadingCompleteScreen) 데이터 타입 */

/** 독서 종료(FE1)에서 넘겨받는 라우트 파라미터 (src/constants/routes.ts의 toReadingComplete) */
export type ReadingCompleteParams = {
  readingRecordId: number | null;
  bookId: number | null;
  durationMinutes: number | null;
  pagesRead: number | null;
  round: number | null;
  /** 이번 저장 후 회차 완독 여부 (FE1 저장 결과). 없으면 null */
  isCompleted: boolean | null;
  remainingPages: number | null;
};

/** 독후감 작성 버튼 상태 */
export type CompleteReviewState = {
  /** 완독한 회차인지 (FE1 저장 결과와 서버 canWrite를 모두 만족해야 true) */
  canWrite: boolean;
  /** 이 회차에 이미 독후감이 있는지 (서버 응답 기준) */
  hasReport: boolean;
  /** 완독 전 남은 페이지 (모르면 null) */
  remainingPages: number | null;
};

export type CompleteStreak = {
  /** 연속 독서 일수 (RewardAccount.dday) */
  days: number;
  /** 오늘 늘어난 일수 */
  delta: number;
};

export type CompleteLevel = {
  level: number;
  /** 이번 독서로 얻은 경험치 */
  gainedExp: number;
  currentExp: number;
  requiredExp: number;
};

export type CompleteRecord = {
  durationMinutes: number;
  goalMinutes: number;
  pagesRead: number;
  goalPages: number;
  focusPercent: number;
  focusModeUsed: boolean;
};

export type CompleteQuest = {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  rewardCoin: number;
};

export type ReadingCompleteData = {
  streak: CompleteStreak;
  level: CompleteLevel;
  record: CompleteRecord;
  quests: CompleteQuest[];
  /** 완료한 퀘스트 보상 코인 합계 */
  rewardCoin: number;
  review: CompleteReviewState;
  /** 파라미터·API가 없어 시안 예시 값으로 채운 항목 (개발 확인용) */
  exampleFields: string[];
};
