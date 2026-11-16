# Alpha-Test 테이블 변경 기록

이 브랜치에서 서버를 띄우면 `ddl-auto=update`가 아래 새 테이블을 만든다. 마이그레이션 파일은 없다. 기존 테이블의 컬럼은 바꾸지 않았다.

공유 개발 DB를 이 브랜치 이전으로 되돌릴 때 아래 SQL을 쓴다. 구매로 생긴 재화 이력(`reward_transactions`)은 지우지 않는다.

## 새로 만든 테이블

### `dday_goals`

D-day 화면의 목표. 사용자마다 여러 행.

| 컬럼 | 타입 | 제약 |
|---|---|---|
| id | bigint | PK, identity |
| user_id | bigint | not null |
| title | varchar(100) | not null |
| target_date | date | not null |
| target_books | integer | not null |
| completed_books | integer | not null |
| created_at | timestamp | not null |
| updated_at | timestamp | not null |

인덱스: `idx_dday_goals_user_id (user_id)`

### `dday_records`

D-day 달력. 날짜마다 읽음(`READ`) 또는 방어권 보호(`PROTECTED`). 기록이 없는 날은 행이 없다.

| 컬럼 | 타입 | 제약 |
|---|---|---|
| id | bigint | PK, identity |
| user_id | bigint | not null |
| record_date | date | not null |
| status | varchar(20) | not null. `READ`, `PROTECTED` |
| created_at | timestamp | not null |
| updated_at | timestamp | not null |

제약: `uk_dday_records_user_id_record_date (user_id, record_date)`

## 기존 테이블에 넣은 행

`shop_items` 컬럼은 그대로다. 서버가 시작할 때 같은 이름의 행이 없으면 아래 6건을 넣는다. 이미 있으면 가격을 덮어쓰지 않는다.

| name | price | type | effect_value | bundle | is_active |
|---|---:|---|---:|---:|---|
| D-day 방어권 1개 | 200 | SHIELD | 1 | 1 | true |
| D-day 방어권 5개 | 900 | SHIELD | 1 | 5 | true |
| D-day 방어권 10개 | 1600 | SHIELD | 1 | 10 | true |
| EXP 부스터 1개 | 200 | EXPERIENCE_BOOSTER | 30 | 1 | true |
| EXP 부스터 5개 | 900 | EXPERIENCE_BOOSTER | 30 | 5 | true |
| EXP 부스터 10개 | 1600 | EXPERIENCE_BOOSTER | 30 | 10 | true |

`effect_value`는 저장만 한다. 방어권 사용과 경험치 배율 계산은 이 값을 읽지 않는다. 구매하면 `user_items`에 보유 수량이 생긴다.

## 테이블 구조는 그대로인 동작 변경

- 퀘스트를 달성하면 `user_quests.status`가 `COMPLETED`를 거쳐 바로 `REWARDED`가 되고, 재화와 경험치가 들어간다. 컬럼 추가는 없다.
- `GET /api/me/reading-today`는 `reading_sessions`와 `sentences`를 읽기만 한다.

## 되돌리는 SQL

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
