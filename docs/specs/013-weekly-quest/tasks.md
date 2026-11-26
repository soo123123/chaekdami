> 상태: in-progress · 작성: 2026-11-25 · 기준: feature/013-weekly-quest@3da4254 · 담당: BE2
> 요구사항: [requirements.md](./requirements.md) · 설계: [design.md](./design.md)

# 013 · 주간 퀘스트 — Tasks

**진행 규칙**
- 위에서부터 순서대로 한다. 끝난 작업은 체크한다.
- 작업 하나는 한 번에 끝나고 바로 검증할 수 있는 크기로 쪼갠다.
- 설계와 다르게 해야 하면 멈추고 보고한다. (S10)

## 1. 퀘스트 목록과 조회

- [x] 1.1 `WeeklyQuest` 목록, `WeeklyQuestSeeder` — R1.2
      검증: `WeeklyQuestSeederTest`
- [x] 1.2 `UserQuestRepository` 종류별 기간 조회 — R1.3, R1.5
      검증: `WeeklyQuestTest` (H2)

## 2. 보상 이력

- [x] 2.1 `RewardLedger` 대상 번호를 남기는 재화 지급, `TransactionReason` 주석 — R4.1, R4.2
      검증: `RewardLedgerTest`

## 3. 생성·진행·지급

- [x] 3.1 `QuestService` 주간 생성·진행·지급, 세션 종료 시각 받기 — R1.1, R1.4, R1.5, R2, R3.1, R4.1
      검증: `QuestServiceTest`
- [x] 3.2 `ReadingSessionRewardService`가 세션 종료 시각을 넘김 — R2.1, R3.2
      검증: `ReadingSessionRewardServiceTest`
- [x] 3.3 H2에서 동시 첫 요청, 이력 번호, 일일 영향 없음 — R1.4, R1.5, R4
      검증: `WeeklyQuestTest`

## 9. 마무리

- [x] 9.1 전체 테스트 — 검증: `cd backend && ./gradlew test` (Java 21·H2로 직접 실행 409/409, main 반영 뒤. `ChaekdamiApplicationTests`는 제외)
- [x] 9.2 계약 검사 — 검증: `python3 scripts/harness/contract-check.py`
- [x] 9.3 PR 34·35·42 병합 뒤 main을 받아 맞추기. PR은 35 다음에 올린다 (2026-11-26 main@6bd51e8 반영, 409/409 통과)
- [ ] 9.4 실제 PostgreSQL에서 `quests`에 `WEEKLY` 저장, 주간 생성·지급 확인 (사람)
- [ ] 9.5 앱 퀘스트 화면 주간 탭, 홈·마이페이지·독서 완료 화면 확인 (사람)
- [x] 9.6 **docs 반영**: design ④의 문서 전부 수정 — 검증: `python3 scripts/harness/docs-check.py`
- [ ] 9.7 상태 줄을 done으로, `docs/specs/README.md` 목록 갱신
