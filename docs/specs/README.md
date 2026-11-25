> 기준: fix/fe1@ef397a6 · 최종 확인: 2026-11-22 · 담당: BE1

# specs — 작업 계획서

> 처음이면 [GUIDE.md Part B](../GUIDE.md#3-part-b-specs-작업-계획-쓰는-법)를 먼저 읽는다.

## 이 폴더는?

새 기능이나 변경을 **요청 → 설계 → 작업 목록** 순서로 계획하고 기록하는 곳이다.
사람은 요청서(requirements)와 설계서(design)를 확인하고, AI는 작업 목록(tasks)을 하나씩 구현한다.

## 한 스펙에 들어 있는 것

| 파일 | 담는 내용 | 비유 |
|---|---|---|
| `requirements.md` | 무엇을 원하나, 언제 완료인가 (R 번호) | 요청서 |
| `design.md` | 어떻게 만드나, 무엇이 바뀌나, 어떤 docs를 고치나 | 도면 |
| `tasks.md` | 작업 순서, 각 작업의 검증 방법 | 공정표 |

양식: [_templates/](./_templates/)

## 흐름 한눈에

```
요청 ─▶ requirements ─✋확인─▶ design ─✋확인(approved)─▶ tasks 구현 ─▶ docs 반영 ─▶ done
                                         │
                       설계대로 안 되면: 멈춤 → 보고 → ✋방향 → design·tasks 먼저 수정 → 재개
```

## 규칙

| # | 규칙 |
|---|---|
| S1 | 폴더 이름: `docs/specs/<3자리 번호>-<영문-slug>/` (예: `003-session-sentence-and-cleanup`) |
| S2 | requirements: 사용자 스토리 + 번호 붙은 완료 조건(`R1.1 ~하면 ~한다`) + **범위 밖** |
| S3 | design: 고정 5칸 — ① 흐름 ② 바뀌는 것(API·DB·규칙) ③ 수정할 파일 ④ **고칠 docs 문서** ⑤ 남은 질문(❓) + 맨 아래 **변경 기록** |
| S4 | tasks: 체크박스 + 연결된 R 번호 + 검증 명령. **마지막 작업은 항상 "docs 반영"** |
| S5 | 상태: `draft` → `approved` → `in-progress` → `done` (대체되면 `superseded`). 각 문서 상태 줄에 적는다 |
| S6 | 승인: 스펙 시작한 사람 + 영향받는 파트 담당 1명. requirements와 design에서 각 1회 |
| S7 | 스펙 필수: API·DB·비즈니스 규칙이 바뀌거나 2개 파트 이상에 걸친 작업. 버그 수정·UI·문구는 생략(docs 영향 있으면 문서만 수정) |
| S8 | 이 규칙을 바꾸려면 이 파일을 고치고 [decisions/](../decisions/)에 이유를 남긴다. 새 스펙부터 적용. 개별 예외는 해당 스펙에 `예외:`로 적는다 |
| S9 | **문서 먼저, 구현 나중.** 바뀔 모습은 design에 먼저 쓰고 승인받은 뒤 구현한다. `docs/domains/*`(현재 모습)는 구현이 끝난 뒤 마지막 작업에서 반영한다 |
| S10 | **설계 변경 루프.** 구현 중 설계대로 안 되면 AI는 멈추고 → 다른 점·이유·선택지를 보고 → 사람이 방향을 주면 → design 변경 기록과 tasks를 먼저 고치고 → 구현을 이어간다. 요구사항·API·DB·규칙·수정 범위가 바뀔 때 해당 |
| S11 | AI는 사람의 방향 없이 `approved` 이후의 requirements·design을 고치지 않는다 |

## 스펙 목록

| 번호 | 이름 | 상태 | 담당 |
|---|---|---|---|
| 000 | [harness-bootstrap](./000-harness-bootstrap/) — docs 지식 베이스와 스펙 체계 만들기 | in-progress | BE1 |
| 001 | [reward-integration](./001-reward-integration/) — 보상(BE2) 병합과 프론트 연결 | in-progress (실기기 확인 8.1·8.3~8.5 남음) | FE1·FE2·BE2 |
| 002 | [reading-reward](./002-reading-reward/) — 독서 보상 연결 (초기안) | superseded → 001 | FE1 |
| 003 | [session-sentence-and-cleanup](./003-session-sentence-and-cleanup/) — 세션 문장 저장과 삭제 데이터 정리 | in-progress (구현·docs 완료, 실기기 확인 남음) | BE1·BE3·FE1 |
| 004 | [reading-certification-app](./004-reading-certification-app/) — 독서 인증 앱 연결과 사진 인증 보상 | in-progress (구현·docs 완료, 실기기 확인 남음) | BE1·FE1·BE2 |
| 006 | [review-delete](./006-review-delete/) — 리뷰(별점) 삭제 API | done | BE3 |
| 007 | [admin-users](./007-admin-users/) — 관리자 회원 목록·정지·역할 변경 API | done | BE3 |
| 010 | [nickname-change](./010-nickname-change/) — 닉네임 변경 API | done | BE3 |
| 011 | [request-limits](./011-request-limits/) — 신고·비밀번호 재설정 요청 제한 | done | BE3 |
| 012 | [community-report](./012-community-report/) — 공개 독후감·문장의 신고와 블라인드, 정지 회원 글 숨김 | done | BE3 |
| 015 | [booster-use-once](./015-booster-use-once/) — 부스터 사용 중복 방지 (ISSUE-BUG-33) | approved (앱 PR 55, 서버는 009 병합 뒤) | BE2 (+FE2) |
