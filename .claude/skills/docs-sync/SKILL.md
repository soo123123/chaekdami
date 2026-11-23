---
name: docs-sync
description: 책다듬이에서 스펙 없이 코드가 바뀌었을 때(PR 병합, 팀원 작업 반영, 버그 수정) docs를 지금 코드에 맞추거나, 병합 전 PR이 하네스 규칙에 맞는지 확인할 때 쓴다. "PR 확인해줘", "병합했으니 문서 맞춰줘", "docs 동기화".
---

# 코드 변경을 docs에 반영

원칙: `docs/`는 지금 코드를 설명한다. 문서와 코드가 다르면 코드가 맞다 (`AGENTS.md` 1장).

## A. 병합 전 PR 확인 (요청받았을 때)

1. PR 정보: 제목, 작성자, **대상 브랜치**, 커밋 수, 바뀐 파일
2. 대상 브랜치가 `main`이 아니면 main과 얼마나 차이 나는지 확인하고 알린다
3. 최신 main 위에 시험 병합해 충돌을 본다 (`git merge --no-commit --no-ff` 후 `git merge --abort`. 실제 병합은 사람이 한다)
4. 확인할 것
   - 새 API·테이블·규칙이 있는가 → 문서 반영 대상
   - 기존 파일 수정이 팀 전체에 영향을 주는가 (설정 파일 등)
   - 비밀값을 코드에 적었는가
   - 앱이 부르는 주소와 서버 주소가 맞는가 (`contract-check.py`)
5. 보고: 병합해도 되는지, 주의할 점, 병합 후 고칠 문서 목록

## B. 병합 후 docs 반영

1. 바뀐 범위: `git log --oneline <이전>..HEAD`, `git diff --stat <이전>..HEAD`
2. 바뀐 코드를 직접 읽는다 (컨트롤러 경로·DTO 필드·엔티티·상수·설정)
3. 도메인별로 고친다
   - `api.md`: 목록 표, 요청·응답 필드, 에러 문구
   - `data.md`: 테이블·컬럼·관계 그림·삭제 순서, 맨 아래 **변경 이력**에 `<브랜치>@<커밋> (PR #N)`
   - `rules.md`: 규칙 · 값 · 코드 위치 · 상태
   - `overview.md`: 핵심 개념, 코드 위치, 현재 상태
   - 환경변수가 늘었으면 `docs/conventions/testing.md` (이름만, 값은 쓰지 않는다)
4. `known-issues.md`: 해결·변경된 항목 수정과 새 문제·질문 기록 모두 issue-log 절차로 한다. 병합된 스펙의 "🚧 진행 중 작업" 행은 지운다 (main 작업 공간에서 고치고 `scripts/harness/known-issues.py push`로 바로 main에 올림. 브랜치 사본은 고치지 않는다)
5. 값은 한 곳에만 쓰고 나머지는 링크한다 (`docs/README.md`)
6. 검사: `python3 scripts/harness/docs-check.py`, `python3 scripts/harness/contract-check.py`
7. 보고: 고친 파일 표, 남은 일, 커밋할 파일과 커밋 메시지 제안 (커밋은 사람이 한다)

## 하지 않는 것

- 코드를 문서에 맞춰 고치지 않는다. 코드를 바꿔야 하면 스펙을 제안한다
- 승인된 스펙의 requirements·design은 고치지 않는다
