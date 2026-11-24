---
name: new-spec
description: 책다듬이에서 새 스펙(requirements → design → tasks)을 시작할 때 쓴다. "새 스펙: ○○", "이거 스펙으로 진행하자"처럼 API·DB·비즈니스 규칙이 바뀌거나 두 파트 이상에 걸친 작업을 시작할 때.
---

# 새 스펙 만들기

규칙 원문: `docs/specs/README.md` (S1~S11). 이 절차와 충돌하면 원문을 따른다.

## 0. 스펙이 필요한지 먼저 판단

- 필요: API(주소·필드), DB(테이블·컬럼), 비즈니스 규칙이 바뀜, 또는 두 파트 이상에 걸침 (S7)
- 불필요: 버그 수정·UI·문구, hooks·skills 같은 작업 도구. 이때는 스펙 없이 진행하고, docs 내용이 바뀌면 문서만 고친다
- 애매하면 사용자에게 한 줄로 묻는다

## 1. 현재 모습부터 읽기

0. `python3 scripts/harness/known-issues.py news`로 지난 확인 이후 바뀐 것을 확인해 사용자에게 짧게 알린다
1. `docs/glossary.md`
2. 관련 도메인의 `docs/domains/<도메인>/overview.md`, 필요한 `api.md`·`data.md`·`rules.md`
3. `python3 scripts/harness/known-issues.py show`(최신 main)에서 관련 ISSUE·TODO·ASK. 고지(5번)의 답을 받은 뒤 그 항목 상태를 `진행 중 (스펙 NNN)`으로 바꿔 issue-log 절차로 push
4. 실제 코드 (문서와 다르면 코드가 맞다)
5. **시작 전 고지** ✋: known-issues 항목(TODO·ISSUE)에서 시작하는 스펙이면, requirements를 쓰기 전에 issue-log "시작 전 고지"대로 적힌 설명(노션 카드 본문·비고 포함)을 담당자에게 보여주고 답을 받는다. 이 대화에서 이미 했으면 건너뛴다. 항목이 없는 스펙은 해당 없음

## 2. 번호와 폴더

- `ls docs/specs/`에서 가장 큰 번호 + 1. 만든 순서대로 붙이고, 재사용·변경하지 않는다
- 폴더: `docs/specs/<3자리 번호>-<영문-slug>/`

## 3. requirements.md만 쓴다

- 양식: `docs/specs/_templates/requirements.md`
- 첫 줄: `> 상태: draft · 작성: <오늘> · 기준: <브랜치>@<짧은 커밋> · 담당: <역할> · 승인: <역할>, <역할>` (`git rev-parse --short HEAD`)
- 배경은 docs 링크·코드 위치를 근거로 쓴다
- 완료 조건은 `R1.1 ~하면, ~한다.` 한 문장씩. "어떻게"(클래스·메서드)는 쓰지 않는다
- 고지에서 담당자가 동의한 완료 기준은 R로 옮기고, 동의하지 않은 제안은 범위 밖, 답하지 않은 것은 남은 질문에 쓴다
- 사용자가 이미 결정한 내용은 배경에 "사람 결정 (날짜)"로 적는다
- **범위 밖**을 꼭 쓴다
- 모르는 것은 "남은 질문(❓)"에 남기고 추측으로 채우지 않는다

## 4. 목록에 추가

`docs/specs/README.md`의 스펙 목록 표에 한 줄: `| NNN | [slug](./NNN-slug/) — 한 줄 설명 | draft | 담당 |`

## 5. 멈추고 확인 요청 ✋

- design.md는 아직 쓰지 않는다
- 사용자에게 보여줄 것: 결정을 어떤 R로 옮겼는지, 남은 질문, "승인하면 design으로 넘어간다"
- 승인을 받으면 상태를 `approved`로 바꾸고 `_templates/design.md`로 design을 쓴다

## 6. design 쓰고 겹침 확인 ✋

- design ③ "수정할 파일"은 경로를 백틱으로 쓴다 (`backend/.../reading/application/X.java`, 폴더는 끝에 `/`). 겹침 검사가 이 칸을 읽는다
- `python3 scripts/harness/known-issues.py overlap --design docs/specs/NNN-slug/design.md` 로 다른 사람의 진행 중 작업과 겹치는지 본다
- 확인 요청 때 겹침 결과를 함께 보여준다. 겹치면 "어느 스펙(담당)이 어느 파일을 함께 고치는지"와 선택지(순서 정하기 / 범위 나누기 / 그대로 진행)를 적는다

## 7. design 승인 후

1. **진행 중 작업 등록**: `python3 scripts/harness/known-issues.py open` → 작업 공간 known-issues의 "🚧 진행 중 작업" 표에 한 줄 `| NNN | <대상 ID> | <담당> | <브랜치> | <paths 출력> | <오늘> |` (`python3 scripts/harness/known-issues.py paths --design ...`가 "건드리는 곳" 칸을 만든다). 대상 항목 상태도 `진행 중 (스펙 NNN)` → `push -m "docs: 스펙 NNN 진행 중 작업 등록"`
2. `_templates/tasks.md`로 tasks를 쓴다 (마지막 작업은 항상 docs 반영)
