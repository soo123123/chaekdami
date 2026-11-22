> 상태: approved · 작성: 2026-11-22 · 기준: fix/fe1@ef397a6 · 담당: BE1 · 승인: 사용자

# 000 · 하네스 기반 만들기 — Requirements

## 1. 배경

- 설계 문서(노션, PDF 5종, 루트 README)와 실제 코드가 많이 달라졌다. DB(MySQL→PostgreSQL), 독후활동 테이블 구조, 보상 지급 시점, 세션 API 경로 등.
- 저장소 안의 현재 기준 API 명세는 리뷰 하나뿐이다. 보상·독서·인증은 노션에 흩어져 있고, D-day·통계·커뮤니티·관리자 API는 문서가 없다.
- 비즈니스 규칙(경험치·부스터·방어권·세션 시간)이 코드 상수에만 있다.
- AI가 작업할 때 읽을 진입점과 작업 절차가 없어, 옛 설계를 근거로 잘못 고칠 위험이 있다.

## 2. 요구사항

### R1. 지식 베이스

팀원과 AI로서, 지금 코드가 어떻게 동작하는지 도메인별로 찾아보기를 원한다.

- **R1.1** 백엔드의 모든 API(`@*Mapping`)가 `docs/domains/*/api.md` 중 한 곳에 요청·응답·에러와 함께 적혀 있다.
- **R1.2** 모든 JPA 엔티티의 테이블이 `docs/domains/*/data.md`에 컬럼·제약과 함께 적혀 있다.
- **R1.3** 코드에 상수로 있는 비즈니스 규칙이 `docs/domains/*/rules.md`에 값과 코드 위치로 적혀 있다.
- **R1.4** 식별자와 용어가 `docs/glossary.md`에 정의돼 있다.
- **R1.5** 설계와 달라진 점은 `docs/decisions/`, 미구현과 알려진 문제는 `docs/known-issues.md`에 있다.

### R2. 진입점

어떤 도구(Claude, Cursor)로 시작해도 같은 규칙과 같은 문서에서 출발하기를 원한다.

- **R2.1** 루트 `AGENTS.md`가 믿는 순서, 작업별로 읽을 문서, 작업 원칙, 검증 명령을 담는다.
- **R2.2** `CLAUDE.md`와 `.cursor/rules/`가 `AGENTS.md`를 가리킨다.

### R3. 스펙 체계

새 작업을 정해진 양식과 절차로 진행하기를 원한다.

- **R3.1** `docs/specs/README.md`에 규칙 S1~S11과 스펙 목록이 있다.
- **R3.2** `docs/specs/_templates/`에 requirements·design·tasks 양식이 있다.
- **R3.3** 기존 작업 문서 2건이 스펙 001·002로 정리돼 있다.

### R4. 사람용 안내

처음 합류한 팀원이 문서 하나로 전체 방식을 이해하기를 원한다.

- **R4.1** `docs/GUIDE.md`가 docs 읽는 법과 specs 쓰는 법, 둘의 연결을 설명한다.

### R5. 검증

문서가 코드와 어긋났는지 스크립트로 확인하기를 원한다.

- **R5.1** `python3 scripts/harness/contract-check.py`를 실행하면 프론트가 부르는 `/api` 경로 중 백엔드에 없는 것을 보여준다.
- **R5.2** `python3 scripts/harness/docs-check.py`를 실행하면 상태 줄 누락, 깨진 링크, API 문서 누락, 비밀값 의심을 보여준다.

## 3. 범위 밖

- 코드 파일 수정
- skills, hooks, ESLint·CI 설정 (다음 스펙)
- 노션 정리(비밀값 포함)
