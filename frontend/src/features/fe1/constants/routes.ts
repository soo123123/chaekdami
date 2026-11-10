import { ROUTES } from '@/constants/routes';

/**
 * FE1 라우트 경로. 공용 라우트(src/constants/routes.ts)의 FE1 부분을 그대로 쓴다.
 * 실제 파일은 src/app/fe1/ 아래에 있다.
 */
export const FE1_ROUTES = ROUTES.fe1;

/** 하단 탭바를 띄우는 FE1 화면 (UI 시안 기준: 서재·커뮤니티 화면). 나머지 FE1 화면은 탭바 없이 보여준다. */
export const FE1_ROUTES_WITH_TAB_BAR: string[] = [FE1_ROUTES.library, FE1_ROUTES.community];

/**
 * 독서 기록 저장 후 이동할 FE2 ReadingCompleteScreen 경로.
 * FE2와 경로·전달 파라미터가 합의되지 않아 null로 둔다.
 * null이면 ReadingEndScreen은 저장 완료 상태만 표시한다.
 */
export const READING_COMPLETE_ROUTE: string | null = null;
