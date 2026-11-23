> 상태: in-progress (구현·docs 완료, 10번 확인 남음) · 작성: 2026-11-23 · 기준: feature/be2-ranking@9be251c · 담당: BE2
> 요구사항: [requirements.md](./requirements.md) · 설계: [design.md](./design.md)

# 005 · 주간 경험치 랭킹 — Tasks

**진행 규칙**
- 위에서부터 순서대로 한다. 끝난 작업은 체크한다.
- 작업 하나는 한 번에 끝나고 바로 검증할 수 있는 크기로 쪼갠다.
- 설계와 다르게 해야 하면 멈추고 보고한다. (S10)

## 1. 주 계산

- [x] 1.1 `RankingWeek` — 한국 날짜로 월·일, 서버 시각 범위 계산 — R1.3, R3.1, R3.7
      검증: `RankingWeekTest` (월요일 0시, 일요일 23:59, 서버 UTC)

## 2. 집계와 조회

- [x] 2.1 `RewardTransactionRepository` 집계 쿼리 3개, `RewardAccountRepository.findAllByUserIdIn` — R1.1, R1.4, R2.1, R3.2, R3.4, R3.6
      검증: 컴파일. 쿼리 조건(INCOME_EXPERIENCE, 기간, 정렬)을 코드 리뷰로 확인
- [x] 2.2 port `UserNicknameReader`와 구현 `RewardUserNicknameReader` — R1.2, R1.5
      검증: 컴파일

## 3. 순위 계산과 API

- [x] 3.1 `RankingService`, `WeeklyRankingResult` — R1, R2, R3.3, R3.4
      검증: `RankingServiceTest` (동점 1·2·2·4, 30위 밖 내 순위, 0점 내 순위 null, 닉네임 없는 사용자 제외, 계정 없으면 레벨 1)
- [x] 3.2 `RankingController` `GET /api/rewards/rankings/weekly` — R1.1
      검증: 컴파일, 전체 테스트

## 9. 마무리

- [x] 9.1 전체 테스트 — 검증: `cd backend && ./gradlew test` (javac로 컴파일 후 JUnit 246개 통과. DB 없이 앱 설정을 띄워 JPQL 파싱·빈 충돌 없음 확인)
- [ ] 9.2 계약 검사 — 검증: `python3 scripts/harness/contract-check.py` (이 PC에 python 없음. 앱에서 아직 부르지 않음)
- [x] 9.3 **docs 반영**: design ④의 문서 전부 수정 — 검증: `python3 scripts/harness/docs-check.py` (python 없어 실행 못 함, 링크는 직접 확인)
- [ ] 9.4 상태 줄을 done으로, `docs/specs/README.md` 목록 갱신 (10번 확인 뒤)

## 10. 사람이 확인

- [ ] 10.1 실제 DB에서 랭킹 API 호출 — 이번 주 경험치 합·동점 순위·내 순위가 맞는지 (집계 쿼리는 DB로 실행해 보지 않음)
- [ ] 10.2 FE1 확인 — 주소와 응답 형태 (design ⑤)
