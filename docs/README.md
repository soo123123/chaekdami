> 기준: fix/fe1@ef397a6 · 최종 확인: 2026-11-22 · 담당: BE1

# docs — 책다듬이 지식 베이스

## 이 폴더는?

지금 코드가 **어떻게 동작하는지**를 적은 문서 모음이다.
문서와 코드가 다르면 코드가 맞다. 다만 앞으로는 **문서를 먼저 고치고 구현한다** ([specs/README.md](./specs/README.md)).

처음 합류했다면 사람용 안내서 [GUIDE.md](./GUIDE.md)부터 읽는다.

## 무엇이 들어 있나

| 폴더/파일 | 내용 | 이럴 때 읽기 |
|---|---|---|
| [overview.md](./overview.md) | 서비스 목적, 주요 기능, 기획 의도 | 처음 합류했을 때 |
| [glossary.md](./glossary.md) | bookId, readingRecordId 같은 용어와 식별자 | 이름이 헷갈릴 때 |
| [architecture.md](./architecture.md) | 전체 구조, 도메인끼리 연결, 프론트 구조 | 여러 파트를 건드릴 때 |
| [conventions/](./conventions/) | API 공통 규칙, 이름 규칙, git, 실행·테스트 | 코드를 쓰기 전 |
| [domains/](./domains/) | 도메인별 개념·API·DB·규칙 (reading · review · reward · dday · user) | 해당 기능 작업 시 |
| [decisions/](./decisions/) | 설계를 왜 바꿨는지 | "왜 이렇게 됐지?" 싶을 때 |
| [known-issues.md](./known-issues.md) | ⚠️ 문제(`ISSUE-`) · ⏳ 할 일(`TODO-`) · ❓ 질문(`ASK-`) 목록 | 작업 고를 때, 문제점 찾을 때 |
| [specs/](./specs/) | 작업 계획서 (requirements → design → tasks) | 새 기능을 시작할 때 |
| [archive/](./archive/) | 옛 설계서·기존 문서 목록과 최신 위치 | 과거 기록 확인 |

## 어떻게 나눴나

- **도메인 단위로 묶었다.** 한 기능 작업에 필요한 개념·API·DB·규칙이 한 폴더(`domains/<도메인>/`)에 모인다. 도메인은 백엔드 패키지와 같다.
- **문서 하나는 한 주제만.** AI와 사람이 필요한 문서만 골라 읽게 한다.
- **값은 한 곳에만.** 같은 값(예: 세션 시간 제한)은 한 문서에만 쓰고 나머지는 링크한다.

| 도메인 | 범위 | 백엔드 패키지 |
|---|---|---|
| [reading](./domains/reading/) | 도서 검색, 개인 서재, 독서 기록(회차), 독서 세션, 오늘·통계 | `com.chaekdami.reading` |
| [review](./domains/review/) | 문장 모음, 리뷰(평점·한줄평), 독후감, 좋아요·신고, 커뮤니티, 관리자 | `com.chaekdami.review` |
| [reward](./domains/reward/) | 경험치·레벨, 재화, 퀘스트, 상점, 부스터, 독서 완료 보상 | `com.chaekdami.reward` |
| [dday](./domains/dday/) | D-day 목표, 연속 독서 달력, 방어권 처리 | `com.chaekdami.dday` |
| [user](./domains/user/) | 회원가입, 로그인, 토큰, 비밀번호, 탈퇴 | `com.chaekdami.user`, `com.chaekdami.config` |

## 문서 쓰는 규칙

1. 맨 위에 상태 줄을 둔다: `> 기준: <브랜치>@<커밋> · 최종 확인: YYYY-MM-DD · 담당: <역할>`
2. 담당은 역할명으로 쓴다: FE1 · FE2 · BE1 · BE2 · BE3
3. 상태 표기: ✅ 완료 · ⏳ 남음 · ❓ 협의 필요
4. 규칙·값 옆에는 **코드 위치**를 적는다. 예: `ReadingSession.MIN_SECONDS`
5. 비밀값은 쓰지 않는다. 환경변수 **이름**만 쓴다.
6. 다이어그램은 Mermaid로 그린다.
7. `domains/`는 **현재 모습**만 적는다. 바뀔 모습은 스펙의 design에 먼저 쓰고, 구현이 끝난 뒤 반영한다.
