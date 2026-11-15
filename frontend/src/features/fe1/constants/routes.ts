import { ROUTES } from '@/constants/routes';

/**
 * FE1 라우트 경로. 공용 라우트(src/constants/routes.ts)의 FE1 부분을 그대로 쓴다.
 * 실제 파일은 src/app/fe1/ 아래에 있다.
 */
export const FE1_ROUTES = ROUTES.fe1;

/** 하단 탭바를 띄우는 FE1 화면 (UI 시안 기준: 서재·커뮤니티 화면). 나머지 FE1 화면은 탭바 없이 보여준다. */
export const FE1_ROUTES_WITH_TAB_BAR: string[] = [FE1_ROUTES.library, FE1_ROUTES.community];
