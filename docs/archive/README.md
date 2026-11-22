> 기준: fix/fe1@ef397a6 · 최종 확인: 2026-11-22 · 담당: BE1

# archive — 옛 설계와 기존 문서

여기 적힌 문서는 **과거 기록**이다. 수정하지 않는다. 이 폴더에 보관한 원본 파일도 고치지 않는다 (docs-check 상태 줄 검사에서 제외). 지금 기준은 오른쪽 "최신 위치"를 본다.

## 1. 노션·PDF (저장소에 없음)

| 문서 | 어디에 | 성격 | 최신 위치 |
|---|---|---|---|
| 캡스톤디자인 계획서 | 노션 "문서" > 프로젝트 계획서 | 과제 목적·기능 기획 | [overview.md](../overview.md) |
| AI를 활용한 독서 자기계발 앱 (발표 자료) | 팀 공유 PDF | 중간 발표 | [overview.md](../overview.md), [architecture.md](../architecture.md) |
| 책다듬이 백프론트 구조 가이드 | 노션 "문서" > 시스템 설계 명세서 | 초기 계층·도메인 구조 | [architecture.md](../architecture.md) |
| 책다듬이 프론트엔드/백엔드/API/DB 명명 규칙 설계서 | 노션 "문서" > 시스템 설계 명세서 | 초기 API·DB·명명 규칙 | [conventions/](../conventions/), [domains/](../domains/) |
| 캡스톤디자인 B조 소프트웨어 아키텍처 설계서 | 노션 Notice | 중간 통합 설계서 | [architecture.md](../architecture.md), [domains/](../domains/) |
| BE1 · BE2 · BE3 · FE2 설계 페이지 | 노션 Notice | 파트별 설계·진행 현황 | 각 [domains/](../domains/) |
| 보상 API, auth-api-for-frontend | 노션 dev | 프론트 전달용 API | [domains/reward/api.md](../domains/reward/api.md), [domains/user/api.md](../domains/user/api.md) |
| 프론트, 백 병합 중 문제 | 노션 Notice | 병합 시점 점검 (대부분 해결) | [known-issues.md](../known-issues.md) |
| 책다듬이 테스트용 명령어 모음 | 노션 Notice | 실행·테스트 방법 | [conventions/testing.md](../conventions/testing.md) |

옛 설계와 달라진 점: [decisions/](../decisions/)

## 2. 저장소 안 기존 문서 (스펙 000에서 정리)

| 원래 위치 | 처리 | 최신 위치 |
|---|---|---|
| 루트 `README.md`의 1~14장 (도메인 분석, 비즈니스 로직 등) | README는 짧게 정리, 설계 내용은 이동 | [overview.md](../overview.md) |
| `docs/review-api-for-frontend.md` | 이동 후 보정 | [domains/review/api.md](../domains/review/api.md) |
| `docs/alpha-test-schema-changes.md` | 원본은 [이 폴더](./alpha-test-schema-changes.md)에 보관, 내용은 각 테이블 변경 이력으로 반영 | [domains/dday/data.md](../domains/dday/data.md), [domains/reward/data.md](../domains/reward/data.md) |
| `docs/reward-integration/` | 스펙 001로 이동 | [specs/001](../specs/001-reward-integration/) |
| `docs/reading-reward/` | 스펙 002로 이동 | [specs/002](../specs/002-reading-reward/) |
| `frontend/AGENTS.md` | 루트 `AGENTS.md`·[conventions/](../conventions/)로 통합 | 루트 `AGENTS.md` |
| `frontend/src/features/fe1/README.md` | [architecture.md](../architecture.md)·[domains/reading](../domains/reading/)·[known-issues.md](../known-issues.md)로 통합 | 같은 곳 |

예전 내용이 필요하면 git 기록에서 본다: `git log --follow -- <원래 경로>`
