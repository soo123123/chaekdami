> 상태: in-progress · 작성: 2026-11-23 · 기준: feature/be3-review-delete@79205bb · 담당: BE3
> 요구사항: [requirements.md](./requirements.md) · 설계: [design.md](./design.md)

# 006 · 리뷰(별점) 삭제 — Tasks

**진행 규칙**
- 위에서부터 순서대로 한다. 끝난 작업은 체크한다.
- 작업 하나는 한 번에 끝나고 바로 검증할 수 있는 크기로 쪼갠다.
- 설계와 다르게 해야 하면 멈추고 보고한다. (S10)

## 1. 저장소

- [x] 1.1 `ReviewLikeRepository`에 리뷰 하나의 좋아요를 모두 지우는 쿼리 추가 — R1.4
      검증: `cd backend && ./gradlew compileJava`
- [x] 1.2 `ReviewReportRepository`에 리뷰 하나의 신고를 모두 지우는 쿼리 추가 — R1.4
      검증: `cd backend && ./gradlew compileJava`

## 2. 서비스

- [x] 2.1 `ReviewService.delete(reviewId)`: 내 리뷰를 찾고(없거나 남의 것이면 404 `REVIEW_NOT_FOUND`), 좋아요 → 신고 → 리뷰 순서로 삭제. 블라인드 여부는 보지 않음 — R1.1, R1.2, R1.4, R1.8, R2.1, R2.2
      검증: 2.2 테스트
- [x] 2.2 `ReviewServiceTest`에 삭제 테스트 추가: 성공(좋아요·신고·리뷰 순서로 삭제), 없는 리뷰 404, 남의 리뷰 404(아무것도 지우지 않음), 블라인드된 리뷰 삭제 — R1.1, R1.2, R1.4, R1.8
      검증: `cd backend && ./gradlew test --tests "com.chaekdami.review.application.ReviewServiceTest"`

## 3. API

- [x] 3.1 `ReviewController`에 `DELETE /api/reviews/{reviewId}` → `204` 추가 — R1.1, R1.3
      검증: `cd backend && ./gradlew compileJava`
- [x] 3.2 `backend/http/review.http`에 리뷰 삭제 요청 예시 추가 — R1.1
      검증: 파일 확인

## 9. 마무리

- [x] 9.1 전체 테스트 — 검증: `cd backend && ./gradlew test` (241개 중 `ChaekdamiApplicationTests.contextLoads` 1개 실패: DB 환경변수 없음, TODO-21. main에서도 같음)
- [x] 9.2 계약 검사 — 검증: `python3 scripts/harness/contract-check.py`
- [x] 9.3 **docs 반영**: design ④의 문서 전부 수정 (known-issues 해결 처리는 PR 병합 후) — R3.1 — 검증: `python3 scripts/harness/docs-check.py`
- [ ] 9.4 상태 줄을 done으로, `docs/specs/README.md` 목록 갱신
