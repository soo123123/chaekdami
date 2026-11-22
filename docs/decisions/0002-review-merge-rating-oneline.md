> 기준: fix/fe1@ef397a6 · 최종 확인: 2026-11-22 · 담당: BE1

# 0002 · 독후활동 테이블 재구성

- 상태: 채택 · 커밋 `60b822f`, `209eec7` · 결정: BE3

## 예전 설계
`quotes`(문장), `ratings`(평점, 회차당 1), `one_line_reviews`(한줄평, 회차당 1), `one_line_review_likes`, `reviews`(독후감, 회차당 1, title·visibility·ai_feedback). API는 `/api/quotes`, `/api/ratings`, `/api/one-line-reviews`, `/api/reviews`.

## 바꾼 이유
- 평점과 한줄평은 화면에서 항상 같이 다루고, 같은 책을 다회독해도 책에 대한 평가는 하나면 충분하다.
- 같은 책(ISBN)끼리 모아 보려면 책 단위가 자연스럽다.
- 독후감은 회차마다 감상이 달라질 수 있어 회차 단위로 남긴다.

## 지금 방식
| 옛 설계 | 지금 | 단위 |
|---|---|---|
| quotes | `sentences` | 회차 |
| ratings + one_line_reviews | `reviews` (rating + one_line) | **책** |
| one_line_review_likes | `review_likes` | |
| (없음) | `review_reports` (신고·블라인드) | |
| reviews (독후감) | `book_reports` | 회차 |
| 문장 visibility | 회차 `reading_records.is_public` | 회차 |

## 영향
- 리뷰 삭제 API가 없다 (한줄평만 빈 문자열로 지움).
- 독후감 제목·AI 피드백 컬럼 없음. `revision`만 준비.
- 자세히: [domains/review](../domains/review/)
