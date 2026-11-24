> 기준: fix/fe1@ef397a6 · 최종 확인: 2026-11-22 · 담당: BE1

# decisions — 설계 변경 기록

옛 설계(노션·PDF·초기 README)와 지금 코드가 다른 이유를 남긴다. 결정 하나에 파일 하나.

> ❓ 0001~0006은 문서 정리(스펙 000) 때 코드·커밋·노션 기록을 보고 **나중에 정리한 것**이다. "바꾼 이유"에는 추정이 섞여 있으니 담당 역할이 확인해 고친다.

| 번호 | 제목 | 영역 |
|---|---|---|
| [0001](./0001-postgresql-supabase.md) | DB를 MySQL에서 PostgreSQL(Supabase)로 | 전체 |
| [0002](./0002-review-merge-rating-oneline.md) | 독후활동 테이블 재구성 (평점+한줄평 통합, 독후감 분리) | review |
| [0003](./0003-reward-on-complete-screen.md) | 보상은 완독이 아니라 세션마다, 독서 완료 화면에서 지급 | reward |
| [0004](./0004-dday-records.md) | 연속 독서 기준을 D-day 달력 하나로 | dday·reward |
| [0005](./0005-reading-session-api.md) | 독서 세션을 한 번의 저장 API로 | reading |
| [0006](./0006-expo-router.md) | 화면 이동은 Expo Router, 라우트는 /fe1·/fe2 | 프론트 |
| [0007](./0007-hooks-skills.md) | AI 작업 규칙을 hooks·skills로 보조, 스펙 없이 관리 | 작업 방식 |
| [0008](./0008-known-issues-on-main.md) | known-issues는 main에서만 고치고 바로 push, 진행 중 작업의 건드리는 곳 공유 | 작업 방식 |
| [0009](./0009-notion-issue-board.md) | 노션 문제 보드를 따로 두고, 할 일을 물으면 문제·질문도 함께 보여준다 | 작업 방식 |
| [0010](./0010-main-news.md) | 작업을 시작할 때 main 업데이트와 내 작업 영향을 알린다 | 작업 방식 |
| [0011](./0011-start-briefing.md) | 할 일·문제를 시작할 때 적힌 설명을 먼저 알리고 스펙을 만든다 | 작업 방식 |

## 새 결정을 남길 때

파일 이름은 `NNNN-영문-slug.md`. 아래 형식을 쓴다.

```md
# NNNN · 제목
- 상태: 채택 · 날짜 · 결정: 역할
## 예전 설계
## 바꾼 이유
## 지금 방식
## 영향
```
