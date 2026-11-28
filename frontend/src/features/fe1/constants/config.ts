/**
 * 개발용 Mock API 사용 여부.
 * false면 서재·검색·한줄평이 실행 중인 백엔드를 호출한다.
 */
export const FE1_USE_DEV_MOCK = false;

/** 독서 종료 버튼이 활성화되기까지 필요한 최소 독서 시간(초). 3분. 백엔드 ReadingSession.MIN_SECONDS 와 같은 값으로 유지 */
export const MIN_READING_SECONDS = 3 * 60;

/**
 * 한 번에 기록할 수 있는 최대 독서 시간(초). 2시간. 백엔드 ReadingSession.MAX_SECONDS 와 같은 값으로 유지 (ISSUE-LIMIT-5, 상한 유지 여부는 ASK-2)
 * 타이머는 이 시간에 닿으면 멈추고, 종료 화면에서도 이보다 길게 입력할 수 없다.
 */
export const MAX_READING_SECONDS = 2 * 60 * 60;

/**
 * 독서 인증 사진 검증에 개발용 Mock을 쓸지 여부.
 * false면 실제 서버(POST /api/reading-records/{id}/certifications)로 검증한다.
 * FE1_USE_DEV_MOCK과 따로 두어, 나머지 독서 API는 실제 서버를 쓰면서 검증만 Mock으로 돌릴 수 있게 한다.
 * Mock 인증 번호는 서버가 발급한 것이 아니라서 사진 인증 보상 확인에는 쓰지 않는다.
 */
export const PHOTO_VERIFY_USE_MOCK = false;

/**
 * 독서 인증 사진 검증을 기다리는 최대 시간(ms). 사진 축소·업로드·AI 판정 전체에 적용한다.
 * 서버는 AI 응답을 최대 약 40초 기다린다(30초 + 빨리 실패하면 1번 다시 시도). 앱이 먼저 포기하지 않도록 45초로 둔다 (스펙 004 R3.1).
 * 검증 중에는 저장 버튼이 비활성화되므로, 응답이 오지 않으면 이 시간 뒤 실패로 처리해 다시 찍도록 안내한다.
 */
export const PHOTO_VERIFY_TIMEOUT_MS = 45_000;
