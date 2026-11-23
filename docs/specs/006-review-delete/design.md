> 상태: approved · 작성: 2026-11-23 · 기준: feature/be3-review-delete@79205bb · 담당: BE3 · 승인: BE3, FE1
> 요구사항: [requirements.md](./requirements.md)

# 006 · 리뷰(별점) 삭제 — Design

## ① 흐름

```
[앱·http] ── DELETE /api/reviews/{reviewId} ──▶ ReviewController.delete
                                                  └▶ ReviewService.delete (트랜잭션 하나)
                                                       1. 현재 사용자 확인 (없으면 401, 필터)
                                                       2. 내 리뷰 찾기 — 없거나 남의 것 → 404 REVIEW_NOT_FOUND
                                                       3. 좋아요 삭제 (review_likes where review_id)
                                                       4. 신고 삭제   (review_reports where review_id)
                                                       5. 리뷰 삭제   (reviews)
                                                  ◀── 204 (본문 없음)
```

- 블라인드 여부는 보지 않는다 (R1.8). 공개용 조회(`requireVisible`)가 아니라 소유자 조회로 찾는다. 수정 API(`ReviewService.update`)와 같은 방식이다.
- 좋아요·신고를 먼저 지우는 순서는 FK 때문이다. 회원 탈퇴·책 삭제 정리(`ReviewCleanupService`)와 같은 순서다.
- 다른 사람이 남긴 좋아요·신고만 지운다. 그 사람들의 다른 데이터에는 이 리뷰를 가리키는 카운터가 없어서 따로 고칠 값이 없다 (R2.2).
- 한줄평 목록·별점 통계·커뮤니티는 `reviews` 행을 그때그때 조회하므로, 행이 지워지면 따로 처리하지 않아도 빠진다 (R1.6).
- `book_id` UNIQUE 제약은 행이 지워지면 풀리므로, 같은 책에 다시 쓸 수 있다 (R1.7).

## ② 바뀌는 것

| 구분 | 변경 | 관련 R |
|---|---|---|
| API | `DELETE /api/reviews/{reviewId}` 추가. 성공 `204`, 없거나 남의 리뷰 `404 REVIEW_NOT_FOUND`, 비로그인 `401` | R1.1~R1.3 |
| DB | 없음 (테이블·컬럼 그대로. 행만 지움) | — |
| 비즈니스 규칙 | 작성자는 자기 리뷰를 블라인드 여부와 관계없이 지울 수 있다. 지우면 그 리뷰의 좋아요·신고도 함께 지운다 | R1.4, R1.8 |
| 에러 코드 | 새로 만들지 않음 (`REVIEW_NOT_FOUND` 재사용) | R1.2 |

## ③ 수정할 파일

| 파일 | 변경 내용 |
|---|---|
| `backend/src/main/java/com/chaekdami/review/presentation/ReviewController.java` | `DELETE /api/reviews/{reviewId}` → `204` |
| `backend/src/main/java/com/chaekdami/review/application/ReviewService.java` | `delete(reviewId)`: 소유자 확인 → 좋아요·신고·리뷰 삭제 |
| `backend/src/main/java/com/chaekdami/review/infrastructure/ReviewLikeRepository.java` | 리뷰 하나의 좋아요 모두 지우기 |
| `backend/src/main/java/com/chaekdami/review/infrastructure/ReviewReportRepository.java` | 리뷰 하나의 신고 모두 지우기 |
| `backend/src/test/java/com/chaekdami/review/application/ReviewServiceTest.java` | 삭제 성공·404(없음·남의 것)·블라인드 리뷰 삭제·삭제 순서 테스트 |
| `backend/src/test/java/com/chaekdami/review/application/ReadingReviewServiceTest.java` | `ReviewService` 생성자 호출에 좋아요·신고 저장소 추가 |
| `backend/http/review.http` | 리뷰 삭제 요청 예시 |

## ④ 고칠 docs 문서

- [ ] `docs/domains/review/api.md` — API 목록 표에 한 줄, "리뷰 삭제" 절 추가 (요청·`204`·에러)
- [ ] `docs/domains/review/rules.md` — §2 "리뷰 삭제" 행을 ✅로 바꾸고 규칙(블라인드 포함, 좋아요·신고 함께 삭제) 적기. TODO-9 표시 줄 지우기
- [ ] `docs/domains/review/overview.md` — 현재 상태의 TODO-9 줄 지우기
- [ ] `docs/known-issues.md` — PR이 main에 병합된 뒤 TODO-9를 해결됨으로 옮기기 (main에서 `known-issues.py`로)

## ⑤ 남은 질문 (❓)

- 없음

> 참고: 누가 좋아요·신고를 누르는 순간에 작성자가 리뷰를 지우면, 좋아요·신고 쪽 요청이 FK 오류로 실패할 수 있다. 드물고 데이터가 깨지지 않아서(리뷰는 이미 없음) 이번에는 따로 막지 않는다.

---

## 변경 기록

| 날짜 | 바뀐 내용 | 이유 | 결정 |
|---|---|---|---|
| 2026-11-23 | ③에 `ReadingReviewServiceTest.java` 추가 | `ReviewService`에 좋아요·신고 저장소를 넣으면 생성자가 바뀌어, 이 테스트의 생성자 호출도 고쳐야 컴파일됨 | BE3 (2026-11-23) |
