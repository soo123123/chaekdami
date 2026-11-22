> 기준: fix/fe1@ef397a6 · 최종 확인: 2026-11-22 · 담당: BE1

# 0005 · 독서 세션을 한 번의 저장 API로

- 상태: 채택 · 결정: BE1·FE1

## 예전 설계
`POST /api/reading-records/{id}/sessions`로 시작 → `PATCH /api/reading-sessions/{id}`로 종료. 테이블에 `paused_seconds`.

## 바꾼 이유
FE1 화면은 타이머를 앱에서 돌리고 종료 화면에서 시간·페이지를 한 번에 저장한다. 시작 요청을 따로 두면 앱이 꺼졌을 때 끝나지 않은 세션이 남는다.

## 지금 방식
- `POST /api/reading-sessions` { bookId, readingTime, startPage, endPage } — FE1 요청 형식 그대로
- 서버가 `bookId`로 지금 읽는 회차를 찾고, 서버 시각으로 `ended_at`·`started_at`을 기록
- 일시정지 시간은 저장하지 않는다 (앱이 순수 독서 시간만 보냄)
- 최소 3분, 최대 2시간

## 영향
- 사용자가 종료 화면에서 시간을 늘려 입력할 수 있다 (서버는 범위만 검증) → [known-issues.md](../known-issues.md)
- 자세히: [domains/reading/rules.md](../domains/reading/rules.md#3-독서-세션)
