> 상태: draft (BE2 승인 2026-11-25, FE2 확인 대기) · 작성: 2026-11-25 · 기준: main@9e4a7c5 · 담당: BE2 · 승인: BE2(2026-11-25), FE2(대기)
> 요구사항: [requirements.md](./requirements.md)

# 015 · 부스터 사용 중복 방지 — Design

## ① 흐름

```
[홈] ── POST /api/rewards/boosters/use {"ownedBoosters": 3} ─▶ BoosterController ─▶ BoosterService.use
  1. ownedBoosters가 음수면 400 VALIDATION_ERROR                                  R1.7
  2. 보상 계정 잠금 (지금과 같음. 같은 사용자의 요청을 하나씩 처리)                  R1.3
  3. ownedBoosters가 있으면 서버의 부스터 합계와 비교 → 다르면 409 REWARD_008       R1.2, R1.4, R1.8
     없으면 비교하지 않음                                                         R1.6
  4. 부스터가 없으면 400 REWARD_006                                              R1.5
  5. 1개 차감, 버프 저장, 응답 (지금과 같음)                                       R1.1

[홈] 실패 시 (앱)
  보유 개수 다시 조회 (자동으로 다시 사용하지 않음)                                 R2.2
  ├ 보낸 개수보다 1개 적음 → "이미 사용됐어요. 남은 부스터 N개", 위젯 갱신           R2.3
  ├ 그 밖 → 지금처럼 서버 메시지 (없으면 "부스터를 사용하지 못했어요.")
  └ 조회 실패 → 버튼을 막고 "확인 필요" (지금과 같음)                               R2.4
```

개수 비교는 반드시 **잠근 뒤, "부스터 없음"보다 먼저** 한다.

### 상황별 결과

| 상황 | 앱 | 서버 | 결과 |
|---|---|---|---|
| 처음 사용 | 3 | 3 | 200, 2개 남음 |
| 처리됐는데 응답이 끊겨 다시 누름 | 3 | 2 | 409 REWARD_008 |
| 재시도가 먼저 처리되고 처음 요청이 늦게 도착 | 3 | 2 | 409 REWARD_008 |
| 마지막 1개가 쓰인 뒤 다시 누름 | 1 | 0 | 409 REWARD_008 |
| 둘 다 0 | 0 | 0 | 400 REWARD_006 |
| 개수를 안 보냄 | — | 2 | 200 (지금과 같음) |

## ② 바뀌는 것

| 구분 | 변경 | 관련 R |
|---|---|---|
| API 요청 | `POST /api/rewards/boosters/use`에 본문 `{"ownedBoosters": 3}` 추가. 정수, 선택. 본문이 없거나 값이 `null`이면 비교하지 않는다 | R1.1, R1.6, R2.1 |
| API 응답 | 성공 응답은 바뀌지 않음 (스펙 009의 응답 변경은 009에서) | R1.1 |
| API 오류 | `409 REWARD_008` "부스터 보유 개수가 달라졌습니다. 개수를 확인해 주세요." 추가. 요청이 겹쳤을 때의 `409 CONCURRENCY_001`은 그대로 | R1.2, R1.8 |
| API 오류 | `ownedBoosters`가 음수거나 정수로 읽을 수 없으면 `400 VALIDATION_ERROR` | R1.7 |
| DB | 없음 | |
| 비즈니스 규칙 | 앱이 아는 부스터 개수와 서버의 개수가 다르면 부스터를 쓰지 않는다 | R1.2 |

`ownedBoosters`에는 부스터 상품(1개·5개·10개)의 보유 개수를 **모두 더한 값**을 보낸다. 홈이 지금 보여주는 값(`boosterCount`)과 같다. 서버는 응답의 `remainingBoosters`와 같은 합계로 비교한다.

## ③ 수정할 파일

| 파일 | 변경 내용 |
|---|---|
| `backend/.../reward/presentation/dto/BoosterUseRequest.java` | (새 파일) `record BoosterUseRequest(Integer ownedBoosters)` |
| `backend/.../reward/presentation/BoosterController.java` | 선택 본문을 받아 서비스에 전달 |
| `backend/.../reward/application/BoosterService.java` | `use(userId, ownedBoosters)`: 음수 검사, 잠근 뒤 개수 비교 |
| `backend/.../reward/domain/RewardErrorCode.java` | `BOOSTER_COUNT_CHANGED("REWARD_008", 409, ...)` |
| `backend/src/test/.../reward/application/BoosterServiceTest.java` | R1.1, R1.2, R1.4~R1.7 |
| `backend/src/test/.../reward/application/BoosterUseConcurrencyTest.java` | (새 파일) H2로 동시 요청과 응답 끊김 뒤 재시도 (R1.2, R1.3) |
| `backend/src/test/.../reward/presentation/BoosterControllerTest.java` | (새 파일) 본문이 없을 때·있을 때, 오류 코드 (R1.6~R1.8) |
| `frontend/src/features/fe2/api/rewardApi.ts` | (FE2) `activateExpBooster(ownedBoosters)`가 본문 전송, 위젯 갱신 알림 함수를 따로 쓸 수 있게 |
| `frontend/src/features/fe2/screens/HomeScreen.tsx` | (FE2) 보유 개수 전달, 실패 뒤 개수 비교와 안내 |

## ④ 고칠 docs 문서

- [ ] `docs/domains/reward/api.md` — 부스터 사용 요청 본문, `REWARD_008`
- [ ] `docs/domains/reward/rules.md` — 부스터 개수 비교 규칙
- [ ] `docs/known-issues.md` — 서버와 앱이 모두 main에 병합된 뒤 ISSUE-BUG-33 해결 처리 (main에서)

## ⑤ 남은 질문 (❓)

- FE2: 앱 수정 일정. 앱은 서버보다 먼저 병합해도 된다 (지금 서버는 본문을 읽지 않는다). 409 확인은 서버 병합 뒤에 한다.

### 순서와 알려진 한계

- 서버 구현은 009가 병합된 뒤 시작한다 (`BoosterService`, `BoosterServiceTest` 겹침). 앱의 `rewardApi.ts`도 009의 앱 작업과 겹치므로 FE2가 함께 처리하거나 순서를 정한다.
- 서버만 병합된 상태에서는 중복을 막지 못한다 (R1.6). 서버와 앱이 모두 병합돼야 해결이다.
- 부스터 상품을 판매 중지하면 앱(판매 중인 상품만 합산)과 서버(전체 합산)의 개수가 달라져 계속 409가 난다. 지금은 부스터 상품 3개가 모두 판매 중이고 판매 중지 기능이 없다. 판매 중지를 만들거나 DB에서 끌 때는 이 비교를 함께 고쳐야 한다.

---

## 변경 기록

| 날짜 | 바뀐 내용 | 이유 | 결정 |
|---|---|---|---|
| | | | |
