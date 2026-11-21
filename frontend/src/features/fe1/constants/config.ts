/**
 * 개발용 Mock API 사용 여부.
 * false면 서재·검색·한줄평이 실행 중인 백엔드를 호출한다.
 */
export const FE1_USE_DEV_MOCK = false;

/** 독서 종료 버튼이 활성화되기까지 필요한 최소 독서 시간(초). 3분 */
export const MIN_READING_SECONDS = 3 * 60;

/**
 * 독서 인증 사진 검증에 개발용 Mock을 쓸지 여부.
 * 백엔드 검증 API(POST /api/reading-photos/verify)가 준비되면 false로 바꾼다.
 * FE1_USE_DEV_MOCK과 따로 두어, 나머지 독서 API는 실제 서버를 쓰면서 검증만 Mock으로 돌릴 수 있게 한다.
 */
export const PHOTO_VERIFY_USE_MOCK = true;

/**
 * 독서 인증 사진 검증을 기다리는 최대 시간(ms). 사진 축소·업로드·LLM 판정 전체에 적용한다.
 * 검증 중에는 저장 버튼이 비활성화되므로, 응답이 오지 않으면 이 시간 뒤 실패로 처리해 다시 찍도록 안내한다.
 * BE1에서 실제 응답 시간을 확인한 뒤 조정한다.
 */
export const PHOTO_VERIFY_TIMEOUT_MS = 15_000;
