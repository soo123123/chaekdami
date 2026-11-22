# 📚 책다듬이 (Chaekdami)

연속 달성과 보상으로 꾸준한 독서와 독후 활동을 돕는 모바일 독서 앱 — 캡스톤디자인 B조

- 책을 검색해 **개인 서재**에 담고, 타이머로 읽은 시간과 페이지를 기록한다.
- 독서할 때마다 **경험치·재화·퀘스트**를 받고, **D-day 달력**으로 연속 독서를 이어간다.
- 인상 깊은 **문장**을 모으고, 완독 후 **별점·한줄평·독후감**을 남겨 같은 책 완독자와 나눈다.

자세한 소개: [docs/overview.md](docs/overview.md)

## 기술 스택

| 영역 | 기술 |
|---|---|
| 앱 | React Native 0.86, Expo SDK 57, Expo Router, Axios |
| 서버 | Java 21, Spring Boot 4.1.1, Spring Security(JWT), Spring Data JPA |
| DB | PostgreSQL (Supabase) |
| 외부 | YES24 Open API, Gmail SMTP |

## 실행

필요한 환경변수 이름과 자세한 방법: [docs/conventions/testing.md](docs/conventions/testing.md)

```bash
# 서버 — http://localhost:8080
cd backend
./gradlew bootRun

# 앱
cd frontend
npm install
npx expo start        # i: iOS 시뮬레이터, a: 안드로이드 에뮬레이터
```

## 폴더 구조

```text
chaekdami/
├── AGENTS.md        # AI·팀원 작업 지도 (작업 전에 먼저 읽기)
├── backend/         # Spring Boot — com.chaekdami.{reading, review, reward, dday, user}
├── frontend/        # Expo — src/app(라우트), src/features/{fe1, fe2}
├── docs/            # 지식 베이스와 작업 계획서
└── scripts/harness/ # 문서·API 계약 검사 스크립트
```

## 문서

| 문서 | 내용 |
|---|---|
| [docs/GUIDE.md](docs/GUIDE.md) | **처음 합류했다면 여기부터** — 문서 읽는 법, 작업 진행 방식 |
| [docs/README.md](docs/README.md) | 문서 목차 |
| [docs/architecture.md](docs/architecture.md) | 전체 구조 |
| [docs/domains/](docs/domains/) | 도메인별 API·DB·규칙 |
| [docs/specs/](docs/specs/) | 작업 계획서 (requirements → design → tasks) |
| [docs/known-issues.md](docs/known-issues.md) | 알려진 문제와 미구현 |

## 개발 방식

API·DB·비즈니스 규칙이 바뀌는 작업은 **문서(스펙)를 먼저 쓰고 확인받은 뒤 구현**한다. 절차: [docs/specs/README.md](docs/specs/README.md)

## 팀

| 역할 | 담당 |
|---|---|
| FE1 | 서재, 도서 검색·등록, 독서, 커뮤니티 |
| FE2 | 홈, 로그인, 마이페이지, 통계, D-day, 보상, 독후감 |
| BE1 | 도서·서재·독서 기록 (reading) |
| BE2 | 보상·퀘스트·상점·D-day (reward, dday) |
| BE3 | 인증·회원, 독후활동 (user, review) |
