> 상태: approved · 작성: 2026-11-22 · 기준: fix/fe1@ef397a6 · 담당: BE1 · 승인: 사용자
> 요구사항: [requirements.md](./requirements.md) · 작업: [tasks.md](./tasks.md)

# 000 · 하네스 기반 만들기 (docs 지식 베이스 + spec 체계) — Design

## 0. 한 줄 요약

흩어진 설계(노션·PDF·README)를 **지금 코드 기준 지식 베이스(`docs/`)** 로 다시 정리하고, 앞으로의 개발을 **requirements → design → tasks** 스펙으로 진행할 수 있게 규칙·양식·진입점을 만든다.

## 1. 왜 하나 (배경)

- 설계 문서(노션, PDF 5종)와 실제 코드가 많이 달라졌다. (DB: MySQL→PostgreSQL, 독후활동 테이블 구조, 보상 지급 시점, 세션 API 경로 등)
- 현재 기준 API 명세가 리뷰 하나뿐이고, 보상·독서·인증은 노션에 흩어져 있으며 D-day·통계·커뮤니티·관리자 API는 문서가 없다.
- 비즈니스 규칙(경험치·부스터·방어권·세션 시간)이 코드 상수에만 있다.
- AI가 작업할 때 읽을 진입점(`AGENTS.md`)과 작업 절차가 없어, 옛 설계를 근거로 잘못 고칠 위험이 있다.

## 2. 무엇을 원하나 (요구사항 요약)

- **R1** 지식 베이스: 지금 코드가 어떻게 동작하는지 도메인별로 찾아볼 수 있다.
- **R2** 진입점: 어떤 도구(Claude, Cursor)로 시작해도 같은 규칙과 같은 문서에서 출발한다.
- **R3** 스펙 체계: 새 작업을 정해진 양식과 절차(사람 확인 2회)로 진행할 수 있다.
- **R4** 사람용 안내: 처음 합류한 팀원이 문서 하나로 전체 방식을 이해한다.
- **R5** 검증: 문서가 코드와 어긋났는지 스크립트로 확인할 수 있다.

**범위 밖** — 상세는 [requirements.md](./requirements.md). skills, hooks, ESLint/CI 설정, 노션 정리(비밀값 포함), 기능 코드 수정. (다음 스펙에서)

## 3. 확정된 결정

### 3.1 docs 정리

| # | 결정 |
|---|---|
| D1 | 기준은 **main 병합 완료 커밋**. 작업은 `docs/harness` 브랜치에서 한다. |
| D2 | 믿는 순서: **코드 > docs 새 문서(지식 베이스) > docs/specs(진행 중) > 기존 문서(루트 README·기존 docs 파일)·노션·PDF(기록)**. 문서와 코드가 다르면 코드가 맞고 **새 문서**를 고친다. |
| D3 | 도메인 5개로 나눈다: `reading` · `review` · `reward` · `dday` · `user` (코드 패키지와 동일) |
| D4 | **기존 문서는 수정·이동하지 않는다.** 필요한 내용은 새 문서에 옮겨 적고(현재 코드 기준으로 보정), 기존 파일은 `docs/archive/README.md`에 "참고용 → 최신은 ○○"으로 목록만 남긴다 (4.3 표). |
| D5 | 노션에서는 현재 코드와 맞는 내용 + 기획 의도(서비스 목적·도메인 분석)를 가져오고, 기획 의도는 `overview.md`에 "기획 의도"로 구분 표시한다. |
| D6 | 루트 `README.md`·`frontend/AGENTS.md` 등 기존 문서는 그대로 둔다. 설계 내용의 최신본은 docs 새 문서에 둔다. 앞으로 최신화와 설계는 **docs 새 문서 기준**으로만 한다. |
| D7 | 코드로 확인 안 되는 기획 항목은 ❓로 남기고 `known-issues.md`에 목록을 만든다. |
| D8 | 담당은 역할명(FE1·FE2·BE1·BE2·BE3)으로 적는다. |
| D9 | 모든 문서 맨 위에 상태 줄을 둔다: `> 기준: <브랜치>@<커밋> · 최종 확인: YYYY-MM-DD · 담당: <역할>` |
| D10 | 상태 표기는 팀 기존 방식: ✅ 완료 · ⏳ 남음 · ❓ 협의 필요 |
| D11 | 비밀값은 어떤 문서에도 쓰지 않는다. 환경변수 **이름**만 쓴다. |
| D12 | 사람용 안내서는 **`docs/GUIDE.md` 1개**. 설명·이유만 쓰고 구체적인 값은 링크로 대신한다. AI는 작업 시 읽지 않아도 된다. |

### 3.2 spec 체계

| # | 결정 |
|---|---|
| S1 | 폴더 이름: `docs/specs/<3자리 번호>-<영문-slug>/` |
| S2 | requirements: 사용자 스토리 + 번호 붙은 완료 조건(`R1.1 ~하면 ~한다`) + **범위 밖** |
| S3 | design: 고정 5칸 — ① 흐름 ② 바뀌는 것(API·DB·규칙) ③ 수정할 파일 ④ **고칠 지식 베이스 문서** ⑤ 남은 질문(❓) + 맨 아래 **변경 기록**(승인 후 바뀐 내용·이유·날짜·결정한 사람) |
| S4 | tasks: 체크박스 + 연결된 R 번호 + 검증 명령. **마지막 작업은 항상 "지식 베이스 반영"** |
| S5 | 상태: draft → approved → in-progress → done (대체된 스펙은 `superseded`) |
| S6 | 승인: 스펙 시작한 사람 + 영향받는 파트 담당 1명. requirements와 design에서 각 1회 확인 |
| S7 | 스펙 필수: API·DB·비즈니스 규칙 변경, 또는 2개 파트 이상 걸친 작업. 버그 수정·UI·문구는 생략(지식 베이스 영향 있으면 문서만 수정) |
| S8 | 규칙 변경은 `docs/specs/README.md` 수정 + `docs/decisions/` 기록. 이후 새 스펙부터 적용. 개별 예외는 해당 스펙에 "예외:"로 명시 |
| S9 | **문서 먼저, 구현 나중.** 동기화(이 스펙) 이후에는 코드가 문서보다 먼저 바뀌지 않는다. 바뀔 모습은 스펙의 design에 먼저 쓰고 승인받은 뒤 구현하며, `docs/domains/*`(현재 모습)는 구현이 끝난 스펙의 마지막 작업에서 반영한다. |
| S10 | **설계 변경 루프.** 구현 중 설계대로 안 되는 게 생기면 AI는 멈추고 → 문서와 다른 점·이유·선택지를 사람에게 보고 → 사람이 방향을 주면 → design(변경 기록)과 tasks를 먼저 고치고 → 구현을 이어간다. 요구사항·API·DB·규칙·수정 범위가 바뀌는 경우에 해당하며, 변수명 같은 세부는 제외한다. |
| S11 | AI는 사람의 방향 없이 approved 이후의 requirements·design을 고치지 않는다. |

## 4. 설계

### 4.1 흐름 (앞으로의 작업 방식)

```
[사람] 한 줄 요청
   ↓  AI: AGENTS.md → docs/specs/README.md → 관련 docs/domains/* 읽기
[AI] requirements.md 작성 ─────────── ✋ 사람 확인 (S6)
[AI] design.md 작성 (④에 고칠 docs 명시) ─ ✋ 사람 확인 → approved
[AI] tasks.md 작성 → 작업 1개씩 구현 → 검증 명령 실행 → 체크
      └ 설계대로 안 되면: 멈춤 → 보고(다른 점·이유·선택지) → ✋ 사람 방향
                         → design 변경 기록·tasks 먼저 수정 → 구현 재개 (S10)
[AI] 마지막 작업: docs/domains/* · known-issues.md 반영 → done
   ↓
다음 스펙은 갱신된 docs를 읽고 시작
```

### 4.2 최종 폴더 구조

```text
README.md                    # (기존 유지 — 수정하지 않음)
AGENTS.md                    # (신규) AI 진입점 — 지도
CLAUDE.md                    # (신규) @AGENTS.md 불러오기 + Claude 전용 메모
.cursor/rules/
├── commit-message.mdc       # (기존 유지)
└── agents.mdc               # (신규) "AGENTS.md를 따른다"
frontend/AGENTS.md           # (기존 유지 — 수정하지 않음)
scripts/harness/
└── contract-check.*         # (신규) 프론트 호출 /api 경로 ↔ 백엔드 매핑 비교
docs/
├── README.md                # 이 폴더는? · 무엇이 들어 있나(표) · 어떻게 나눴나 · 문서 규칙
├── GUIDE.md                 # 사람용 안내서 (docs + specs 한 문서)
├── overview.md              # 서비스 목적 · 주요 기능 · 기획 의도 (노션·README 내용을 옮겨 적음)
├── glossary.md              # itemId · bookId · readingRecordId · readingSessionId · userQuestId …
├── architecture.md          # 계층 · 도메인 간 연결(port·이벤트) · 프론트 구조 · 인증 흐름
├── conventions/
│   ├── api.md               # 인증 헤더 · 에러 형식 · 전체 에러 코드 표 · 날짜 형식 · X-User-Id 과도기
│   ├── naming.md            # BE/FE/DB 명명 규칙 (명명 규칙 설계서 중 현재 맞는 것)
│   ├── git.md               # 브랜치 · 커밋 규칙(.cursor/rules 내용) · PR 체크리스트
│   └── testing.md           # 빌드·테스트 실행 명령 · .http 파일 · 테스트 계정(로컬용)
├── domains/
│   ├── reading/  { overview.md, api.md, data.md, rules.md }
│   ├── review/   { … }
│   ├── reward/   { … }
│   ├── dday/     { … }
│   └── user/     { … }
├── decisions/               # 0001-postgresql-supabase.md … (설계 변경 이유)
├── known-issues.md          # 알려진 문제 · 미구현 · ❓ 기획 질문
├── specs/
│   ├── README.md            # 이 폴더는? · 한 스펙에 들어 있는 것 · 흐름 · 규칙(S1~S8) · 스펙 목록
│   ├── _templates/ { requirements.md, design.md, tasks.md }
│   ├── 000-harness-bootstrap/   # 이 문서
│   ├── 001-reward-integration/  # done (기존 docs/reward-integration 내용을 새 양식으로 옮겨 적음)
│   ├── 002-reading-reward/      # superseded → 001 (기존 docs/reading-reward 내용을 옮겨 적음)
│   └── 003-session-sentence-and-cleanup/  # draft (requirements 초안까지)
├── (기존 파일들)             # review-api-for-frontend.md · alpha-test-schema-changes.md ·
│                            # reward-integration/ · reading-reward/ — 그대로 둠 (수정 금지)
└── archive/
    └── README.md            # 기존 문서·옛 설계서 목록 → 최신 문서 위치 안내
```

### 4.3 기존 내용 옮겨 적기 표 (원본은 그대로 둔다)

| 원본 (수정 안 함) | 새 문서 | 처리 |
|---|---|---|
| `docs/reward-integration/*` | `docs/specs/001-reward-integration/` | 새 양식으로 옮겨 적고 상태 done |
| `docs/reading-reward/*` | `docs/specs/002-reading-reward/` | 옮겨 적고 상태 superseded → 001 |
| `docs/review-api-for-frontend.md` | `docs/domains/review/api.md` | 옮겨 적고 현재 코드와 대조해 보정 |
| `docs/alpha-test-schema-changes.md` | 각 `domains/*/data.md`의 "변경 이력" | 테이블별로 나눠 옮겨 적음 |
| `README.md` 1~14장(설계 내용) | `docs/overview.md` 등 | 옮겨 적음 (README는 그대로) |
| 노션 BE1·BE2·BE3·FE2 설계, 보상 API, 테스트 명령어 | 해당 `domains/*`, `conventions/testing.md` | 현재 코드와 맞는 내용만 |
| PDF 5종 | `docs/archive/README.md` | 파일은 넣지 않고 목록·노션 링크만 |

`docs/archive/README.md`에는 위 원본 전부를 "참고용 → 최신은 ○○" 형태로 적어, 원본을 연 사람이 새 문서로 넘어가게 한다.

### 4.4 문서별 양식

**도메인 문서 4종** (도메인마다 같은 모양)

| 파일 | 담는 내용 |
|---|---|
| `overview.md` | 한 줄 설명 · 핵심 개념 · 코드 위치(패키지) · 다른 도메인과의 연결 · 담당 |
| `api.md` | 엔드포인트 표(메서드·경로·설명·인증·상태) + 각 API 요청/응답 예시 · 에러 코드 |
| `data.md` | 테이블 · 컬럼 · 제약(UNIQUE·인덱스) · 관계(Mermaid ERD) · 변경 이력 |
| `rules.md` | 규칙 표: **규칙 · 값 · 코드 위치 · 상태** (예: 세션 최소 시간 · 3분 · `ReadingSession.MIN_SECONDS` · ✅) |

**`AGENTS.md`** (100줄 이내)
1. 믿는 순서 (D2)
2. 작업별로 읽을 문서 표 (예: 보상 작업 → `docs/domains/reward/`, `conventions/api.md`)
3. 스펙이 필요한 경우(S7)와 절차 → `docs/specs/README.md`
4. 검증 명령 (백엔드 테스트 · 프론트 타입 검사 · contract-check)
5. 작업 원칙: **문서 먼저, 구현 나중**(S9) · 설계와 다르면 멈추고 보고(S10) · 승인된 문서는 사람 방향 없이 고치지 않음(S11)
6. 금지: 비밀값 기록, 옛 설계(노션·PDF)를 근거로 코드 변경
7. `docs/GUIDE.md`는 사람용 — 작업 시 읽지 않아도 됨

**`docs/GUIDE.md`**
0. 3분 요약 → 1. 왜 이렇게 관리하나 → 2. Part A docs 읽는 법 → 3. Part B specs 쓰는 법 → 4. 둘이 어떻게 이어지나 → 5. 예시로 한 바퀴(스펙 003 완료 후 작성) → 6. 자주 묻는 질문

### 4.5 수정할 파일

- 신규: 위 4.2의 (신규) 표시 파일과 docs 새 문서 전부
- **수정·이동하는 기존 파일: 없음** (루트 README, frontend/AGENTS.md, 기존 docs 파일, .cursor/rules/commit-message.mdc 모두 그대로)
- **코드 파일은 수정하지 않는다.**

### 4.6 검증 방법

| 확인 | 방법 |
|---|---|
| API 누락 없음 | 백엔드 `@*Mapping` 개수 = `docs/domains/*/api.md` 엔드포인트 개수 (스크립트) |
| 프론트·백엔드 경로 일치 | `python3 scripts/harness/contract-check.py` 결과를 `known-issues.md`에 반영 |
| 문서 헤더 | 모든 `docs/**/*.md`(archive 제외)에 상태 줄 존재 (스크립트) |
| 링크 깨짐 없음 | 문서 내 상대 링크 대상 파일 존재 확인 (스크립트) |
| 비밀값 없음 | 키·비밀번호 패턴 검색 결과 0건 |

## 5. 진행 순서 (tasks 미리보기)

| 단계 | 내용 | 사람 확인 |
|---|---|---|
| P0 | main 병합 확인 → `docs/harness` 브랜치 생성 · 기준 커밋 기록 | |
| P1 | 뼈대: 폴더 · `docs/README.md` · `specs/README.md` · 템플릿 3종 · `GUIDE.md`(0~4, 6장) | |
| P2 | 공통: `glossary.md` · `conventions/*` · `architecture.md` | |
| P3 | **reward 도메인 시범 작성** (4종) | ✋ 형식 확인 |
| P4 | reading · review · dday · user 도메인 작성 | |
| P5 | `overview.md` · `decisions/` · `known-issues.md` · `archive/README.md`(기존 문서 → 최신 위치 안내) | |
| P6 | specs 001·002를 새 양식으로 옮겨 적기 · **003 requirements 초안** | ✋ 003 요구사항 확인 |
| P7 | 진입점: `AGENTS.md` · `CLAUDE.md` · `.cursor/rules/agents.mdc` (모두 신규) | |
| P8 | `contract-check` 스크립트 작성·실행 → 결과 반영 | |
| P9 | 4.6 검증 전부 실행 · 이 스펙 done 처리 | ✋ 최종 확인 |

## 6. 남은 질문 (❓)

1. ~~커밋 방식~~ → 결정: 파일 정리는 AI, 커밋은 사람 (2026-11-22)
2. **기획 질문** — "상태 변경 5분"의 의미, `isPublic`이 무엇의 공개인지, 세션 2시간 상한 유지 여부. (❓로 두고 `known-issues.md`에 모음)
3. **다음 스펙 후보** — 004 skills, 005 hooks + ESLint/테스트 환경, 006 독서 인증 사진. 순서는 이 스펙 완료 후 정한다.
