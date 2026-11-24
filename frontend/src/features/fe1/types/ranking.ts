/** 주간 랭킹 타입 (스펙 005 응답 모양). 두 랭킹이 같은 모양을 쓰고 score의 뜻만 다르다. */
export type RankingType = 'readingTime' | 'experience';

export type RankingEntry = {
  rank: number;
  nickname: string;
  level: number;
  /** readingTime: 이번 주 독서 시간(초) / experience: 이번 주 경험치 */
  score: number;
  /** 요청한 사용자 본인이면 true */
  me: boolean;
};

export type MyRanking = {
  /** 이번 주 점수가 0이면 null (순위 없음) */
  rank: number | null;
  nickname: string;
  level: number;
  score: number;
};

export type WeeklyRanking = {
  /** 이번 주 월요일 (yyyy-MM-dd, 한국 날짜) */
  weekStartDate: string;
  /** 이번 주 일요일 (yyyy-MM-dd, 한국 날짜) */
  weekEndDate: string;
  /** 최대 30명. 서버가 준 순서와 순위를 그대로 쓴다 */
  rankings: RankingEntry[];
  /** 30명 밖이어도 내려온다 */
  myRanking: MyRanking;
};
