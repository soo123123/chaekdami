> 상태: approved (2026-11-24, BE2 승인 · FE2 승인은 구두로 알린 뒤 BE2가 승인으로 판단 · 응답 필드 변경은 병합 전에 ⑤ 확인) · 작성: 2026-11-24 · 기준: feature/009-booster-reading-time@299a3b9 · 담당: BE2 · 승인: BE2, FE2
> 요구사항: [requirements.md](./requirements.md)

# 009 · 부스터는 책 읽는 동안에만 시간이 흐름 — Design

## ① 흐름

```
[상점] ── POST /api/rewards/boosters/use ─▶ BoosterService
   └ 보상 계정 잠금 → 부스터 1개 차감 → user_buffs에 새 행 (켠 시각, 남은 시간 1800초)

[독서 화면] 타이머(FE1) ─ 읽은 시간·일시정지 ─▶ 위젯(FE2): 남은 시간 − 읽은 시간을 화면에만 표시

[독서 완료] ── POST /api/rewards/reading-sessions/{id} ─▶ ReadingSessionRewardService → RewardService.grantReadingExperience
   └ 보상 계정 잠금 → 남은 부스터를 켠 순서대로 적용 → 적용한 만큼 남은 시간 차감 → 비율만큼 추가 경험치

[위젯·상점·레벨] ── GET /api/rewards ─▶ 남은 시간 합계
```

### 적용 시간 계산

부스터 1개마다 한 행을 만들고, 켠 순서대로 하나씩 적용한다.

```
적용 시간 = 가장 작은 값(
    이 부스터의 남은 시간,
    켠 시각부터 세션 종료(저장) 시각까지 지난 시간 (음수면 0),
    독서 시간 − 앞의 부스터에 이미 적용한 시간 )
```

| 예 | 적용 | 남음 | R |
|---|---|---|---|
| 45분 독서, 부스터 30분 | 30분 | 0분 | R2.1 |
| 20분 독서, 부스터 30분 | 20분 | 10분 | R1.5 |
| 부스터를 켜고 40분 독서, 중간에 1시간 일시정지 | 30분 | 0분 | R1.3 |
| 45분 독서 중 20분째에 켜고 일시정지 없음 | 25분 | 5분 | R2.5 |
| 독서가 끝난 뒤에 켜고 보상을 나중에 받음 | 0분 | 30분 | R2.4 |
| 어제 5분 남긴 부스터 + 45분 독서 중 40분째에 하나 더 켬 | 5 + 5 = 10분 | 25분 | R1.6, R2.5 |

- 경험치는 지금의 비율 계산(`ExperiencePolicy.boostedExperience`)을 그대로 쓴다 (R2.2).
- 기본 보상은 세션당 1번만 지급하므로 차감도 1번이다 (R2.6). 계정을 잠근 상태에서 차감한다.
- 세션 종료 시각은 서버가 저장 요청을 받은 시각이다. 켠 뒤의 일시정지와 종료 화면에 머문 시간은 구분하지 못해, 독서 도중에 켠 경우 조금 더 인정될 수 있다 (R2.5 사람 결정).

## ② 바뀌는 것

| 구분 | 변경 | 관련 R |
|---|---|---|
| API | `GET /api/rewards`: `expBuffExpiredAt` 삭제, `boosterRemainingSeconds`(정수, 없으면 0) 추가. `expBuffActive`는 남은 시간이 0보다 클 때 `true` | R3.1 |
| API | `POST /api/rewards/boosters/use`: `buffEndAt` 삭제, `boosterRemainingSeconds` 추가. `remainingBoosters`는 그대로 | R1.1, R1.6 |
| DB | `user_buffs.remaining_seconds` (int, NULL 허용) 추가. 새 행은 `buff_end_at`을 비운다. 컬럼 삭제는 하지 않는다 | R1 |
| DB | 옛 행은 `remaining_seconds`가 NULL이라 적용 대상이 아니다 (옮기지 않음) | 사람 결정 |
| 비즈니스 규칙 | 부스터 시간은 실제 시각이 아니라 독서 시간으로 줄어든다. 유효 기간 없음 | R1, R2 |

- 예: 응답 `"expBuffActive": true, "boosterRemainingSeconds": 1200`
- 컬럼을 NULL 허용으로 두어 `ddl-auto=update`에서 기존 행이 있어도 추가된다.
- **서버가 먼저 병합되면** 앱은 `expBuffExpiredAt`이 없어 위젯을 숨기고, 상점은 "EXP 부스터를 사용했어요."만 보여준다 (코드 확인, 실행은 안 함). 앱 수정이 병합될 때까지 남은 시간을 볼 수 없다.
- 켠 시각은 응답에 넣지 않는다. 지금 앱은 독서 화면을 떠나야 상점에서 부스터를 켤 수 있다.

## ③ 수정할 파일

| 파일 | 변경 내용 |
|---|---|
| `backend/.../reward/domain/UserBuff.java` | 남은 시간, 적용·차감 계산. 만료 시각 기준 계산 삭제 |
| `backend/.../reward/infrastructure/UserBuffRepository.java` | 남은 시간이 있는 부스터를 켠 순서로 조회, 합계 조회. 만료 시각 기준 조회 삭제 |
| `backend/.../reward/application/BoosterService.java` | 쓸 때마다 새 행 추가 |
| `backend/.../reward/application/BoosterUseResult.java` | 응답 필드 변경 |
| `backend/.../reward/application/RewardService.java` | 보상 조회의 남은 시간, 독서 경험치의 적용·차감 |
| `backend/.../reward/application/RewardStatusResult.java` | 응답 필드 변경 |
| `backend/src/test/.../reward/domain/UserBuffTest.java` | 위 예시 표를 테스트로 |
| `backend/src/test/.../reward/application/BoosterServiceTest.java` | 새 행 추가, 남은 시간 합계 |
| `backend/src/test/.../reward/application/RewardServiceBoosterTest.java` | 새로 만듦. 40분 독서에 30분 적용(R4.1), 차감 |
| `frontend/src/features/fe2/api/rewardApi.ts` | (FE2 확인 필요) 응답 타입 |
| `frontend/src/features/fe2/components/BoosterFloatingWidget.tsx` | (FE2 확인 필요) 남은 시간, 읽는 동안 줄어드는 표시 |
| `frontend/src/features/fe2/screens/ShopScreen.tsx` | (FE2 확인 필요) 안내 문구 |
| `frontend/src/features/fe2/screens/RewardScreen.tsx` | (FE2 확인 필요) 안내 문구 |
| `frontend/src/features/fe1/hooks/reading/useReadingTimer.ts` | (FE1 확인 필요) 읽은 시간·일시정지 상태를 위젯에 알림 |

- 병합 순서: `RewardService.java`를 ISSUE-BUG-9(`fix/be2-reward-status`)도 고쳤다. 그 브랜치가 먼저 병합된 뒤 main을 받아 구현한다.

## ④ 고칠 docs 문서

- [ ] `docs/domains/reward/rules.md` — 3장 부스터 규칙, ISSUE-BUG-6 표시 줄
- [ ] `docs/domains/reward/api.md` — 두 API 응답 필드
- [ ] `docs/domains/reward/data.md` — `user_buffs`
- [ ] `docs/domains/reward/overview.md` — 부스터 설명, ISSUE-BUG-6 표시 줄

## ⑤ 남은 질문 (❓)

- ❓ (FE1) 위젯이 독서 타이머의 읽은 시간과 일시정지 상태를 알 수 있게 하는 작업을 FE1이 하나, FE2가 하나?
- ❓ (FE2) 앱 수정(팀 회의 결정)을 서버와 같은 때에 병합하나?
- ❓ (FE2) 응답 필드 이름 `boosterRemainingSeconds`(초)로 괜찮나?

---

## 변경 기록

| 날짜 | 바뀐 내용 | 이유 | 결정 |
|---|---|---|---|
| | | | |
