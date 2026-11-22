> 기준: main@721fa71 · 최종 확인: 2026-11-22 · 담당: BE1

# 0007 · AI 작업 규칙을 hooks·skills로 보조, 스펙 없이 관리

- 상태: 채택 · 2026-11-22 · 결정: BE1

## 예전 설계
스펙 000(harness-bootstrap)은 docs 지식 베이스와 스펙 체계까지만 만들고, hooks·skills는 "다음 스펙 후보"로 미뤘다. 검사 스크립트는 사람이나 AI가 직접 실행해야 했다.

## 바꾼 이유
- 규칙이 문서에만 있으면 AI가 빠뜨린다 (검사 미실행, 커밋 규칙 위반 등).
- 스펙 처리·문서 반영·문제 기록 같은 같은 절차를 매번 설명하고 있었다.
- hooks·skills는 API·DB·비즈니스 규칙을 바꾸지 않는 **작업 도구**라 스펙 대상(S7)이 아니다. 스펙 번호는 기능 변경에만 쓴다.

## 지금 방식
- hooks 3개: 문서·API 파일 수정 후 검사 알림(H1), git commit·push·merge 차단(H2), 손대면 안 되는 파일 차단·승인된 스펙 수정 확인(H3)
- skills 4개: new-spec, spec-next, docs-sync, issue-log
- 사용법: [conventions/harness.md](../conventions/harness.md)

## 영향
- Claude Code에만 적용된다. Cursor는 `.cursor/rules`만 쓴다.
- H1은 알려주기만 한다. contract-check 불일치가 0건이 되면 막는 방식으로 올릴지 정한다.
- 스펙 000 설계서의 "다음 스펙 후보(004 skills, 005 hooks, 006 독서 인증)" 번호는 예약이 아니었다. 스펙 번호는 만든 순서대로 붙인다.
