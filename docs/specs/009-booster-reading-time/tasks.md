> 상태: in-progress · 작성: 2026-11-24 · 기준: feature/009-booster-reading-time@f075b4f · 담당: BE2
> 요구사항: [requirements.md](./requirements.md) · 설계: [design.md](./design.md)

# 009 · 부스터는 책 읽는 동안에만 시간이 흐름 — Tasks

**진행 규칙**
- 위에서부터 순서대로 한다. 끝난 작업은 체크한다.
- 작업 하나는 한 번에 끝나고 바로 검증할 수 있는 크기로 쪼갠다.
- 설계와 다르게 해야 하면 멈추고 보고한다. (S10)

## 1. 부스터 남은 시간

- [x] 1.1 `UserBuff` 남은 시간과 적용·차감 계산 — R1.5, R1.7, R2.1, R2.4, R2.5
      검증: `UserBuffTest` (design ① 예시 표)
- [x] 1.2 `UserBuffRepository` 켠 순서 조회, 남은 시간 합계 — R1.6, R3.1
      검증: DB 없이 앱 설정을 띄워 쿼리 문법 확인

## 2. 서비스와 API

- [x] 2.1 `BoosterService` 쓸 때마다 새 행, 응답에 남은 시간 합계 — R1.1, R1.6
      검증: `BoosterServiceTest`
- [x] 2.2 `RewardService` 독서 경험치에 적용·차감 — R1.2, R1.3, R1.4, R1.8, R2.1, R2.2, R4.1
      검증: `RewardServiceBoosterTest` (40분 독서에 30분)
- [x] 2.3 보상 조회 응답에 남은 시간 — R3.1
      검증: `RewardServiceBoosterTest`

## 3. 앱 (FE2·FE1)

- [ ] 3.1 위젯·상점·레벨 화면을 남은 시간으로 — R3.1, R3.2, R3.4
- [ ] 3.2 읽는 동안 실시간 감소, 일시정지하면 멈춤 — R3.3

## 9. 마무리

- [x] 9.1 전체 테스트 — 검증: `cd backend && ./gradlew test` (2026-11-26 main 반영 뒤 Java 21·H2로 직접 실행 405/405. `ChaekdamiApplicationTests` 제외)
- [x] 9.2 계약 검사 — 검증: `python3 scripts/harness/contract-check.py`
- [x] 9.3 ISSUE-BUG-9(`fix/be2-reward-status`) 병합 뒤 main을 받아 맞추기 — 그 브랜치의 `RewardServiceTest`가 이 스펙에서 지운 조회 메서드를 쓰므로 함께 고친다
- [ ] 9.4 FE2에게 응답 필드 변경과 병합 시기 확인 (design ⑤)
- [ ] 9.5 최신 빌드로 30분보다 긴 독서 재테스트 (사람) — R4.2
- [ ] 9.6 **docs 반영**: design ④의 문서 전부 수정 — 검증: `python3 scripts/harness/docs-check.py` (서버 내용은 2026-11-24 반영, 앱 반영 남음)
- [ ] 9.7 상태 줄을 done으로, `docs/specs/README.md` 목록 갱신
