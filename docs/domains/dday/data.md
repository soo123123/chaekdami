> 기준: fix/fe1@ef397a6 · 최종 확인: 2026-11-22 · 담당: BE2

# dday 데이터

테이블은 JPA 엔티티로 생성된다 (`ddl-auto=update`). 두 테이블 모두 `BaseTimeEntity` (`created_at`, `updated_at`).
`users`와 FK가 없어서 회원 탈퇴 시 `DdayCleanupListener`가 지운다.

## dday_goals

엔티티: `DdayGoal`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | bigint | PK | |
| user_id | bigint | not null, INDEX `idx_dday_goals_user_id` | |
| title | varchar(100) | not null | |
| target_date | date | not null | |
| target_books | int | not null | 1~999 |
| completed_books | int | not null | 0~목표 권수 |
| created_at, updated_at | timestamp | not null | |

## dday_records

엔티티: `DdayRecord`. 연속 독서의 **유일한 기준**이다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | bigint | PK | |
| user_id | bigint | not null | |
| record_date | date | not null | |
| status | varchar(20) | not null | `READ` · `PROTECTED` (API에서는 소문자 `read` · `protected`) |
| created_at, updated_at | timestamp | not null | |

UNIQUE `uk_dday_records_user_id_record_date` (user_id, record_date) — 하루 한 건

## 변경 이력

| 시점 | 변경 | 원본 기록 |
|---|---|---|
| Alpha-Test | `dday_goals`, `dday_records` 추가 (옛 설계의 `streak_logs` 대신) | `docs/alpha-test-schema-changes.md` |
| `39219cd` | 연속 독서 기준을 D-day 달력으로 통합, 방어권 자동 차감 연결 | [specs/001](../../specs/001-reward-integration/) |
| `891e313` | 방어로 막힌 날이 나중에 읽음으로 바뀌면 방어권 환불 | |

### Alpha-Test 변경 되돌리기

공유 개발 DB를 Alpha-Test 이전으로 되돌릴 때 쓴다 (원본: `docs/alpha-test-schema-changes.md`). 구매로 생긴 재화 이력(`reward_transactions`)은 지우지 않는다.

구매 이력이 있으면 `user_items`를 먼저 지운 다음 상품을 지운다.

```sql
DELETE FROM user_items
WHERE shop_item_id IN (
    SELECT id FROM shop_items
    WHERE name IN (
        'D-day 방어권 1개',
        'D-day 방어권 5개',
        'D-day 방어권 10개',
        'EXP 부스터 1개',
        'EXP 부스터 5개',
        'EXP 부스터 10개'
    )
);

DELETE FROM shop_items
WHERE name IN (
    'D-day 방어권 1개',
    'D-day 방어권 5개',
    'D-day 방어권 10개',
    'EXP 부스터 1개',
    'EXP 부스터 5개',
    'EXP 부스터 10개'
);

DROP TABLE IF EXISTS dday_records;
DROP TABLE IF EXISTS dday_goals;
```
