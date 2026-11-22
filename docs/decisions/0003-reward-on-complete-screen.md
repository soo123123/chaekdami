> 기준: fix/fe1@ef397a6 · 최종 확인: 2026-11-22 · 담당: BE1

# 0003 · 보상은 세션마다, 독서 완료 화면에서 지급

- 상태: 채택 · 커밋 `41b2cd0`, `8b13aaa`, `afce03f` · 결정: BE2·FE1·FE2 · 스펙: [001](../specs/001-reward-integration/)

## 예전 설계
`POST /api/reading-records/{id}/complete`(완독) 때 `CompleteReadingService`가 경험치·퀘스트·D-day를 한 번에 처리.
그 뒤 한때는 세션 저장(`POST /api/reading-sessions`) 안에서 퀘스트 보상을 처리했다 ([specs/002](../specs/002-reading-reward/)).

## 바꾼 이유
- 매일 꾸준히 읽게 하려면 완독이 아니라 **매 독서**에 보상이 있어야 한다.
- 세션 저장 안에서 보상까지 처리하면 독서 도메인과 보상 도메인이 강하게 묶이고, 보상 실패가 기록 저장 실패로 번진다.
- 완료 화면에서 받은 보상을 그대로 보여줘야 해서, 보상 결과를 응답으로 받는 별도 API가 필요했다.

## 지금 방식
```
POST /api/reading-sessions        → 세션 저장만
POST /api/rewards/reading-sessions/{id} → 경험치·퀘스트·D-day·레벨업 (세션당 1번, 재호출 시 같은 내역)
```
완독 API는 보상을 주지 않는다.

## 영향
- 보상 중복 방지를 위해 `reward_transactions.reference_id` + UNIQUE, `reading_session_rewards` 추가
- 퀘스트 수령 API 제거, 달성 즉시 자동 지급
- 자세히: [domains/reward/rules.md](../domains/reward/rules.md#1-독서-완료-보상)
