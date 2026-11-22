> 상태: in-progress (구현 완료, 7.1 테스트·8.x 실기기 확인 남음) · 기준: fix/fe1@ef397a6 · 담당: FE1·FE2·BE2
> 원본: `docs/reward-integration/tasks.md` — 스펙 000에서 이 위치로 옮김. 결정 요약: [decisions/0003](../../decisions/0003-reward-on-complete-screen.md), [0004](../../decisions/0004-dday-records.md)

# 001 · 보상(BE2) 브랜치 병합과 프론트 연결 — Tasks

설계: [design.md](./design.md)

## Phase 1. 병합
- [x] 1.1 `fix/integration2` 로컬 병합 (충돌 없음) — R1.1

## Phase 2. 백엔드
- [x] 2.1 `UserBuffRepository.findOverlappingBuffs`, `UserBuff.overlapSeconds` — R5.4
- [x] 2.2 `ExperiencePolicy.boostedExperience(exp, boostedSeconds, durationSeconds)` + 테스트
- [x] 2.3 `RewardService.grantReadingExperience` 겹친 시간 기준으로 변경
- [x] 2.4 `UserBuff.overlapSeconds` 테스트

## Phase 3. FE1
- [x] 3.1 `ReadingRecordResult.sessionId`, `readingApi` 저장 결과 — R2.1, R2.3
- [x] 3.2 `toReadingComplete`·`ReadingEndScreen` 전달 — R2.2

## Phase 4. FE2 독서 완료 화면
- [x] 4.1 `rewardApi.claimReadingSessionReward` — R3.1
- [x] 4.2 `useReadingComplete` 보상 호출·상태·재시도 — R3.1~R3.5, R3.8
- [x] 4.3 `StreakLevelCard`·`RewardCoinCard` 로딩/실패/레벨업/사진 보너스/재진입 — R3.3~R3.7

## Phase 5. FE2 D-day·연속일
- [x] 5.1 `ddayApi` 타입·저장 본문 — R4.2
- [x] 5.2 `DdayScreen` 보기 전용, 서버 연속일 — R4.1, R4.3, R4.4
- [x] 5.3 홈·마이페이지·레벨·통계 연속일 서버 값 — R4.3

## Phase 6. FE2 부스터
- [x] 6.1 `rewardApi.activateExpBooster`, 보상 상태에 부스터 필드 — R5.2
- [x] 6.2 `ShopScreen` 부스터 사용 카드 — R5.1, R5.2
- [x] 6.3 `ShopScreen`·`RewardScreen` 적용 중 표시 — R5.3

## Phase 7. 검증·커밋
- [ ] 7.1 `./gradlew test` — 작업 환경에서 Gradle·Maven 저장소 접근이 막혀 미실행. 바꾼 계산 로직만 단독 컴파일로 13개 케이스 확인. 로컬에서 실행 필요
- [x] 7.2 `npx tsc --noEmit` 통과. `expo lint`는 ESLint 미설정으로 미실행
- [x] 7.3 로컬 커밋 (백엔드, 프론트)

커밋: `afce03f` 병합, `0979aa9` 백엔드 부스터, `ef397a6` 프론트

## Phase 8. 프로토타입 테스트 (사용자)
- [ ] 8.1 새 계정으로: 저장 → 완료 화면 값 확인 → 뒤로 갔다 재진입(같은 값, 강조 없음)
- [ ] 8.2 `skip-reading.mjs`로 30분 독서 → 퀘스트 달성·코인 확인
- [ ] 8.3 부스터 구매 → 사용 → 독서 → 2배(부분 적용) 확인
- [ ] 8.4 홈·마이페이지·레벨·통계·D-day 연속일이 모두 같은지
- [ ] 8.5 네트워크 끊고 완료 화면 진입 → 다시 시도
