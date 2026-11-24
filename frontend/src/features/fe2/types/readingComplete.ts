/** 독서 완료 화면(ReadingCompleteScreen) 데이터 타입 */

/** 독서 종료(FE1)에서 넘겨받는 라우트 파라미터 (src/constants/routes.ts의 toReadingComplete) */
export type ReadingCompleteParams = {
  readingRecordId: number | null;
  /** 저장된 독서 세션 번호. 있으면 진입 시 보상 API를 호출한다 */
  sessionId: number | null;
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
  /** 이번 독서로 얻은 경험치 (독서 + 사진 보너스 + 달성 퀘스트) */
  gainedExp: number;
  currentExp: number;
  requiredExp: number;
  /** 이번 독서로 레벨이 올랐는지 */
  leveledUp: boolean;
  /** 사진 인증 보너스 경험치. 받지 않았으면 0 */
  photoBonusExp: number;
  /** 부스터가 적용됐는지 */
  boosted: boolean;
};

/**
 * 보상 영역 상태
 * - none: 세션 번호가 없어 보상을 받지 않음 (미리보기 등, 조회 값만 표시)
 * - loading: 보상 받는 중
 * - granted: 이번 진입에서 보상을 받음
 * - alreadyGranted: 이미 받은 세션 (같은 내역, 획득 강조 생략)
 * - error: 보상 요청 실패 (다시 시도 가능)
 */
export type CompleteRewardState = 'none' | 'loading' | 'granted' | 'alreadyGranted' | 'error';

export type CompleteRecord = {
  durationMinutes: number;
  goalMinutes: number;
  pagesRead: number;
  goalPages: number;
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
  /** 이번 독서로 받은 코인 (달성 퀘스트 + 레벨업 승급) */
  rewardCoin: number;
  rewardState: CompleteRewardState;
  review: CompleteReviewState;
  /** 파라미터·API가 없어 시안 예시 값으로 채운 항목 (개발 확인용) */
  exampleFields: string[];
};
