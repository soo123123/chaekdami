/**
 * 개발용 Mock API 사용 여부.
 * 백엔드 계약이 확정되고 httpReadingApi가 구현되면 false로 바꾼다.
 * 프로덕션 빌드(__DEV__ === false)에서는 항상 실제 API 계층을 사용한다.
 */
export const FE1_USE_DEV_MOCK = __DEV__ && true;

/** 독서 종료 버튼이 활성화되기까지 필요한 최소 독서 시간(초). 3분 */
export const MIN_READING_SECONDS = 3 * 60;
