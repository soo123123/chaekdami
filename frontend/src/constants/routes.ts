import type { Href } from 'expo-router';

/**
 * 앱 공용 라우트 경로 (FE1 + FE2).
 *
 * - 화면 코드에서 경로 문자열('/fe1/...', '/fe2/...')을 직접 쓰지 말고 이 상수를 쓴다.
 * - 파라미터가 필요한 이동(특히 FE1 ↔ FE2 경계)은 아래 to* 함수를 쓴다.
 *   파라미터 이름·형식은 이 파일에서만 정한다.
 * - 실제 파일은 src/app/ 아래에 있다. 경로를 추가하려면 파일을 먼저 만든다
 *   (typedRoutes가 켜져 있어 없는 경로는 타입 오류가 난다).
 * - 공용 파일이므로 수정 시 FE1/FE2 서로 PR로 알린다.
 */
export const ROUTES = {
  home: '/',

  fe1: {
    library: '/fe1/library',
    customize: '/fe1/library-customize',
    search: '/fe1/book-search',
    info: '/fe1/book-info',
    register: '/fe1/book-register',
    manualRegister: '/fe1/manual-register',
    detail: '/fe1/book-detail',
    readingStart: '/fe1/reading-start',
    readingEnd: '/fe1/reading-end',
    community: '/fe1/community',
  },

  fe2: {
    mypage: '/fe2/user/mypage',
    readingStats: '/fe2/user/reading-stats',
    dday: '/fe2/reward/dday',
    level: '/fe2/reward/reward',
    shop: '/fe2/reward/shop',
    quest: '/fe2/reward/quest',
    reviewWrite: '/fe2/review/review-write',
    reviewDetail: '/fe2/review/review-detail',
    readingComplete: '/fe2/reading/reading-complete',
  },
} as const;

/* ------------------------------------------------------------------ */
/* 파라미터가 있는 이동. 라우트 파라미터는 모두 문자열로 넘긴다.             */
/* ------------------------------------------------------------------ */

/** 책 상세 (FE1) — 서재·홈 현재 책 카드에서 사용 */
export const toBookDetail = (bookId: number): Href => ({
  pathname: ROUTES.fe1.detail,
  params: { bookId: String(bookId) },
});

/** 독서 시작 (FE1) — 책 상세·홈 '이어 읽기'에서 사용 */
export const toReadingStart = (bookId: number): Href => ({
  pathname: ROUTES.fe1.readingStart,
  params: { bookId: String(bookId) },
});

/** 커뮤니티 (FE1) — 특정 완독 도서를 선택한 채로 열 때 bookId를 넘긴다 */
export const toCommunity = (bookId?: number): Href =>
  bookId === undefined ? ROUTES.fe1.community : { pathname: ROUTES.fe1.community, params: { bookId: String(bookId) } };

/**
 * 독서 완료 (FE2) — 독서 종료(FE1)에서 기록 저장 성공 후 이동한다.
 * - readingRecordId: 저장된 독서 기록 ID
 * - bookId: '계속 독서하기'로 같은 책 독서 시작 화면에 돌아갈 때 사용
 * - durationMinutes / pagesRead: '오늘의 독서 기록' 표시용 (없으면 FE2 화면이 예시 값을 보여준다)
 * - round / isCompleted: 회독 수와 이번 저장 후 완독 여부 (완독이면 독후감 작성 버튼 활성화)
 * - remainingPages: 완독 전일 때 남은 페이지 (독후감 버튼 안내 문구용)
 */
export const toReadingComplete = (record: {
  readingRecordId: number;
  bookId: number;
  durationMinutes?: number;
  pagesRead?: number;
  round?: number;
  isCompleted?: boolean;
  remainingPages?: number;
}): Href => {
  const params: Record<string, string> = {
    readingRecordId: String(record.readingRecordId),
    bookId: String(record.bookId),
  };
  if (record.durationMinutes !== undefined) params.durationMinutes = String(record.durationMinutes);
  if (record.pagesRead !== undefined) params.pagesRead = String(record.pagesRead);
  if (record.round !== undefined) params.round = String(record.round);
  if (record.isCompleted !== undefined) params.isCompleted = record.isCompleted ? '1' : '0';
  if (record.remainingPages !== undefined) params.remainingPages = String(record.remainingPages);
  return { pathname: ROUTES.fe2.readingComplete, params };
};

/** 독후감 작성 (FE2) */
export const toReviewWrite = (readingRecordId: number, mode?: 'edit'): Href => ({
  pathname: ROUTES.fe2.reviewWrite,
  params: mode ? { readingRecordId: String(readingRecordId), mode } : { readingRecordId: String(readingRecordId) },
});

/** 독후감 상세 (FE2) */
export const toReviewDetail = (readingRecordId: number): Href => ({
  pathname: ROUTES.fe2.reviewDetail,
  params: { readingRecordId: String(readingRecordId) },
});
