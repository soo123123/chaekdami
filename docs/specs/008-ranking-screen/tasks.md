> 상태: in-progress · 작성: 2026-11-24 · 기준: feature/008-ranking-screen@80bf48f · 담당: FE1
> 요구사항: [requirements.md](./requirements.md) · 설계: [design.md](./design.md)

# 008 · 랭킹 화면 — Tasks

**진행 규칙**
- 위에서부터 순서대로 한다. 끝난 작업은 체크한다.
- 설계와 다르게 해야 하면 멈추고 보고한다. (S10)

## 1. 데이터

- [x] 1.1 응답 타입, `rankingApi`, 개발용 예시 데이터, `RANKING_USE_DEV_MOCK` — R2, R3, R4.5
      검증: `cd frontend && npx tsc --noEmit`
- [x] 1.2 `useWeeklyRanking` (종류 전환, 다시 불러오기) — R2.1, R4.2, R4.4
      검증: `cd frontend && npx tsc --noEmit`

## 2. 화면

- [x] 2.1 은·동 메달 이미지와 이미지 연결 — R2.7
- [x] 2.2 전환 탭, 순위 항목, 내 순위 줄, `RankingScreen` — R2, R3, R4
      검증: `cd frontend && npx tsc --noEmit`

## 3. 이동

- [x] 3.1 라우트, 하단 탭, 탭 화면 목록, 전환 애니메이션 — R1
      검증: `cd frontend && npx tsc --noEmit`

## 4. 결정 반영 (2026-11-28, ASK-16·19·20, TODO-44)

- [x] 4.1 독서 시간 초까지 표시 (`formatDurationWithSeconds`) — R2.5
- [x] 4.2 내 순위 줄의 공동 순위·순위 없음 이유 — R3.2, R3.4, R3.5
- [x] 4.3 주가 바뀌면 앱 복귀 때 다시 조회, 지난주 안내, 당겨서 새로고침, 빈 목록 문구 — R4.3, R4.6, R4.7
      검증: `cd frontend && npx tsc --noEmit` · 바뀐 파일 `npx eslint` 0건

## 5. 사람이 확인

- [ ] 5.1 실기기: 탭 5개 표시와 이동, 공동 순위, 긴 닉네임, 작은 화면, 초까지 표시한 점수 길이, 당겨서 새로고침 — R1, R2, R3, R4.7
      진행(2026-11-28, iPhone 17 Pro 시뮬레이터·로컬 서버): 탭 5개·이동, 두 랭킹 전환, 초까지 표시(`1시간 38분 3초`), 내 순위 줄 확인. 공동 순위·순위 없음 문구는 데이터가 없어(2명, 점수 다름) 못 봄. 긴 닉네임·작은 화면·실제 휴대폰은 남음
- [x] 5.2 서버 병합 후 `RANKING_USE_DEV_MOCK`을 `false`로 바꾸고 실제 값 확인 — R2~R4
      결과(2026-11-28): 로컬 서버로 이번 주(11.23–11.29) 독서 시간·경험치 순위와 내 순위가 서버 값대로 나옴
      진행: `false`로 바꿈 (2026-11-28). 실제 서버 값 확인 남음 (관리자 계정의 "집계 대상이 아니에요", 주가 바뀐 뒤 앱 복귀 포함)

## 9. 마무리

- [x] 9.1 계약 검사 — 검증: `python3 scripts/harness/contract-check.py` (스펙 005 병합 전에는 랭킹 경로 2건이 나올 수 있음)
      결과: 랭킹 경로 2건만 불일치 (스펙 005 병합 대기). 병합 뒤 다시 확인
- [x] 9.2 앱 화면 확인 — 예시 데이터로 두 랭킹·빈 목록·오류
      결과: 웹(375·320 너비)에서 확인. iOS·Android 기기는 5.1
- [x] 9.3 **docs 반영**: design ④ (architecture 반영함. reward/overview·overview는 스펙 005가 같은 줄을 고쳐 병합 뒤 반영) — 검증: `python3 scripts/harness/docs-check.py`
- [ ] 9.4 상태 줄을 done으로, `docs/specs/README.md` 목록 갱신 (5번 확인 뒤)
