> 기준: main@82df578 + 스펙 004 · 최종 확인: 2026-11-22 · 담당: BE1

# 실행과 테스트

## 1. 환경

| 항목 | 버전·값 | 근거 |
|---|---|---|
| Java | 21 | `backend/build.gradle` |
| Spring Boot | 4.1.1 | `backend/build.gradle` |
| Gradle | Wrapper 사용 (`./gradlew`) | `backend/gradle/wrapper` |
| DB | PostgreSQL (Supabase, Session pooler) | `application-dev.properties` |
| Expo SDK | 57 | `frontend/package.json` |
| React Native / React | 0.86.3 / 19.2.3 | `frontend/package.json` |

## 2. 환경변수

값은 문서에 적지 않는다. 팀 공유 위치에서 받는다.

> ⚠️ [ISSUE-SEC-2](../known-issues.md#issue-sec-2) 팀 노션에 비밀값이 평문으로 있다. ⚠️ [ISSUE-SEC-1](../known-issues.md#issue-sec-1) `application-dev.properties`의 메일 비밀번호가 평문이다.

| 이름 | 쓰는 곳 | 필수 |
|---|---|---|
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | dev 프로필 DB (Supabase Session pooler 주소·사용자명·비밀번호) | dev |
| `LOCAL_DB_URL`, `LOCAL_DB_USERNAME`, `LOCAL_DB_PASSWORD` | local 프로필 DB | local |
| `YES24_API_KEY` | YES24 도서 검색 | ✅ |
| `JWT_SECRET` | JWT 서명 | ✅ |
| `MAIL_PASSWORD` | 비밀번호 재설정 메일 발송 | 메일 기능 |
| `OCR_PROVIDER` | 독서 인증 AI 선택: `gemini` 또는 `mock`(기본) | |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | 독서 인증 Gemini 키·모델 (`OCR_PROVIDER=gemini`일 때 키 필수) | 인증 AI |
| `EXPO_PUBLIC_API_BASE_URL` | 앱이 부를 서버 주소 | 실기기 테스트 시 |

프로필 기본값은 `dev`다 (`spring.profiles.active=dev`). 로컬 DB를 쓰려면 `local` 프로필로 실행한다.

## 3. 실행

### 백엔드

```bash
cd backend
./gradlew bootRun            # http://localhost:8080, 로그에 "Started ChaekdamiApplication"
```

- 테이블은 JPA가 만든다 (`ddl-auto=update`). 마이그레이션 파일은 없다.
- Supabase 무료 플랜은 오래 안 쓰면 일시정지된다. 연결 오류가 나면 대시보드에서 Restore project.
- Supabase Session pooler는 전체 연결이 15개뿐이라 서버 하나당 DB 연결을 3개로 제한한다 (`spring.datasource.hikari.maximum-pool-size`).

### 프론트엔드

```bash
cd frontend
npm install                  # 처음 한 번
npx expo start               # i: iOS 시뮬레이터, a: 안드로이드 에뮬레이터
npx expo start -c            # 캐시 지우고 실행
npx expo start --tunnel      # 같은 와이파이가 아닐 때 실기기
```

### 개발용 스위치 (`frontend/src/features/fe1/constants/config.ts`)

| 상수 | 현재 | 뜻 |
|---|---|---|
| `FE1_USE_DEV_MOCK` | `false` | `true`면 서재·검색·독서·한줄평이 Mock 사용 |
| `PHOTO_VERIFY_USE_MOCK` | `false` | `true`면 독서 인증 사진 검증을 Mock으로 (서버 미호출). Mock 인증 번호는 보상 확인에 쓰지 않는다 |
| `REVIEW_USE_DEV_MOCK` (`fe2/api/reviewApi.ts`) | `false` | 독후감 Mock |

## 4. 테스트

| 대상 | 명령 | 비고 |
|---|---|---|
| 백엔드 단위 테스트 | `cd backend && ./gradlew test` | `ChaekdamiApplicationTests.contextLoads`는 DB 비밀번호가 없으면 실패 |
| 백엔드 일부만 | `./gradlew test --tests '*ReadingSessionServiceTest'` | |
| 프론트 린트 | `cd frontend && npm run lint` | ⏳ [TODO-20](../known-issues.md#todo-20) ESLint 설정 없음 |
| 프론트 타입 검사 | `cd frontend && npx tsc --noEmit` | |
| 계약 검사 | `python3 scripts/harness/contract-check.py` | 프론트 `/api` 호출 ↔ 백엔드 경로 |
| 문서 검사 | `python3 scripts/harness/docs-check.py` | 상태 줄·링크·API 누락·비밀값 |

### 수동 API 테스트

`backend/http/*.http` (IntelliJ HTTP Client)

| 파일 | 내용 |
|---|---|
| `auth.http` | 회원가입, 로그인, `/api/me`, 입력값 오류 케이스 |
| `review.http` | 독후활동 API |

### 로컬 테스트 계정

| 이메일 | 닉네임 |
|---|---|
| `tester@chaekdami.local` | `tester` |

비밀번호는 팀 노션 "책다듬이 테스트용 명령어 모음"에 있다. DB에 계정이 없으면 `auth.http`의 1번 요청(회원가입)부터 실행한다.

### 개발용 도구

- `frontend/scripts/skip-reading.mjs` — 독서 타이머를 N초 앞당긴다 (최소 독서 시간 3분 테스트용). 커밋하지 않는다.
