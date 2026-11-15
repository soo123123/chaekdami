/**
 * FE1 라우트 경로. 실제 파일은 src/app/fe1/ 아래에 있다.
 * (설계 문서의 /reading/* 경로 대신 현재 브랜치의 /fe1/* 구조를 따른다.)
 */
export const FE1_ROUTES = {
  search: '/fe1/book-search',
  info: '/fe1/book-info',
  register: '/fe1/book-register',
  manualRegister: '/fe1/manual-register',
  library: '/fe1/library',
  customize: '/fe1/library-customize',
  detail: '/fe1/book-detail',
  readingStart: '/fe1/reading-start',
  readingEnd: '/fe1/reading-end',
} as const;

/**
 * 독서 기록 저장 후 이동할 FE2 ReadingCompleteScreen 경로.
 * FE2와 경로·전달 파라미터가 합의되지 않아 null로 둔다.
 * null이면 ReadingEndScreen은 저장 완료 상태만 표시한다.
 */
export const READING_COMPLETE_ROUTE: string | null = null;
