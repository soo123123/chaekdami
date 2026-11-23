> 상태: in-progress (2026-11-22 승인, 구현·docs 완료, 사람 확인 남음) · 작성: 2026-11-22 · 기준: feature/004-reading-certification@e979d3c · 담당: BE1
> 요구사항: [requirements.md](./requirements.md) · 설계: [design.md](./design.md)

# 003 · 세션 문장 저장과 삭제 데이터 정리 — Tasks

**진행 규칙**
- 위에서부터 순서대로 한다. 끝난 작업은 체크한다.
- 작업 하나는 한 번에 끝나고 바로 검증할 수 있는 크기로 쪼갠다.
- 설계와 다르게 해야 하면 멈추고 보고한다. (S10)
- 배포 순서는 서버(1~3) 먼저, 앱(4) 나중이다 (R2.3).

## 1. 서버 — 세션 저장 때 문장 저장

- [x] 1.1 port `SessionSentenceRecorder` (reading/application/port) + 구현 `SentenceServiceSessionSentenceRecorder` (review/infrastructure, `SentenceService.recordFromSession` 호출) — R1.1
      검증: `cd backend && ./gradlew compileJava`
- [x] 1.2 `ReadingSessionService.create`: 세션 저장·인증 연결 뒤 문장 저장 (쪽 번호 = `endPage`), 예외는 그대로 전파. `CreateReadingSessionRequest.sentence` 주석 갱신 — R1.1~R1.5
      검증: `cd backend && ./gradlew test --tests '*ReadingSessionServiceTest'` — 문장 있음(recorder 호출, 쪽 번호 `endPage`) / 문장 없음·공백 / recorder 예외 시 전파 케이스 추가
- [x] 1.3 `ReadingSessionControllerTest`: 문장 규칙 위반(501자)이면 400 `VALIDATION_ERROR` — R1.4
      검증: `cd backend && ./gradlew test --tests '*ReadingSessionControllerTest'`

## 2. 서버 — 책 삭제 시 독후활동 정리

- [x] 2.1 port `BookActivityCleaner` + 구현 `ReviewBookActivityCleaner` (`ReviewCleanupService.deleteAllOfBook` 호출) — R3.1
      검증: `cd backend && ./gradlew compileJava`
- [x] 2.2 `BookService.deleteBook`: 맨 앞에서 독후활동 정리 호출 + 테스트 (정리 → 인증 → 세션 → 회차 → 책 순서, 정리 예외 시 이후 삭제 안 함) — R3.1, R3.2
      검증: `cd backend && ./gradlew test --tests '*BookServiceTest'`
- [x] 2.3 R3.3 확인: `ReviewCleanupService.deleteAllOfBook`이 `bookId`(내 서재 책 번호) 기준이라 다른 사용자 데이터를 지우지 않는지 쿼리 확인, 결과를 이 줄에 적기 — R3.3
      검증: 코드 읽기
      결과 (2026-11-22): 리뷰·독후감·문장 모두 `book_id`(= 내 서재 `books.id`, 사용자마다 다름) 기준으로 지운다. 같은 책끼리 묶는 값은 `reviews.isbn`이라 별도 칸이고, 삭제 쿼리는 `isbn`을 쓰지 않는다. 좋아요·신고는 "그 `book_id`의 리뷰에 달린 것"만 지운다. → 다른 사용자 데이터는 지워지지 않음. 코드 변경 없음

## 3. 서버 — 회원 탈퇴 시 reading 정리

- [x] 3.1 `deleteAllByUserId`를 `CertificationRepository`·`ReadingSessionRepository`·`ReadingRecordRepository`·`BookRepository`에 추가 — R4.1
      검증: `cd backend && ./gradlew compileJava`
- [x] 3.2 `ReadingCleanupService.deleteAllOfUser` (인증 → 세션 → 회차 → 책) + `ReadingCleanupListener` (`UserWithdrawnEvent`) + 테스트 (삭제 순서) — R4.1, R4.2
      검증: `cd backend && ./gradlew test --tests '*ReadingCleanup*'`

## 4. 앱 — 한 번만 저장 요청

- [x] 4.1 `readingApi.saveReadingRecord`: 세션 요청에 `sentence` 넣기, 문장 API 호출 제거 — R2.1, R2.2
      검증: `cd frontend && npx tsc --noEmit` + `python3 scripts/harness/contract-check.py` 불일치 0건 (R5.1)

## 5. 직접 확인 (사람)

- [ ] 5.1 독서 종료 저장 → 문장 모음에 문장이 쪽 번호(`endPage`)와 함께 보이고, 홈 오늘 문장 수가 1 늘어남 — R1.1, R1.2, R1.6
- [ ] 5.2 같은 저장이 세션 1건으로만 남음 (책 상세 회차 기록) — R2
- [ ] 5.3 책 삭제 → 그 책의 문장·리뷰·독후감이 문장 모음·커뮤니티에서 사라짐 — R3.1
- [ ] 5.4 (테스트 계정) 탈퇴 → 서재 데이터가 DB에 남지 않음 — R4.1

## 9. 마무리

- [x] 9.1 전체 테스트 — 검증: `cd backend && ./gradlew test` (`contextLoads`는 DB 없으면 실패: [TODO-21](../../known-issues.md#todo-21))
      결과 (2026-11-22): 237개 중 236개 통과. 실패 1개는 `contextLoads` (DB 비밀번호 없음). 새 port 구현·리스너의 실제 빈 연결은 서버 기동으로 확인 필요
- [x] 9.2 계약 검사 — 검증: `python3 scripts/harness/contract-check.py`
- [x] 9.3 **docs 반영**: design ④의 문서 전부 수정, known-issues에 "응답만 끊긴 뒤 다시 시도하면 세션 2건" 새로 기록 — 검증: `python3 scripts/harness/docs-check.py`
- [ ] 9.4 상태 줄을 done으로, `docs/specs/README.md` 목록 갱신 — 5단계(사람 확인)가 끝나면 한다
