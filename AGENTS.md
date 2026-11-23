# AGENTS.md — 책다듬이 작업 지도

AI(Claude, Cursor 등)와 팀원이 작업을 시작할 때 가장 먼저 읽는 파일이다. 짧게 유지한다. 자세한 내용은 링크한 문서에 있다.

## 1. 무엇을 믿나 (순서)

1. **코드** — 실제 동작
2. **`docs/`** — 지금 코드를 설명하는 지식 베이스 ([docs/README.md](docs/README.md))
3. **`docs/specs/`** — 진행 중인 작업 계획 (바뀔 모습)
4. 노션·PDF·git 기록 — 과거 기록. **이것을 근거로 코드를 바꾸지 않는다** ([docs/archive/](docs/archive/README.md))

문서와 코드가 다르면 코드가 맞다. 문서가 틀렸으면 고치고, 코드를 바꿔야 하면 스펙을 만든다.

## 2. 작업별로 읽을 문서

| 작업 | 먼저 읽기 |
|---|---|
| 어떤 작업이든 | [docs/glossary.md](docs/glossary.md), [docs/conventions/api.md](docs/conventions/api.md) |
| 서재·검색·독서 기록·세션·통계 | [docs/domains/reading/](docs/domains/reading/) |
| 문장·리뷰·독후감·커뮤니티·신고 | [docs/domains/review/](docs/domains/review/) |
| 경험치·레벨·퀘스트·상점·부스터 | [docs/domains/reward/](docs/domains/reward/) |
| D-day 목표·연속 독서·방어권 | [docs/domains/dday/](docs/domains/dday/) |
| 로그인·토큰·회원 | [docs/domains/user/](docs/domains/user/) |
| 여러 도메인에 걸친 작업 | [docs/architecture.md](docs/architecture.md) |
| 새 기능·API·DB·규칙 변경 | [docs/specs/README.md](docs/specs/README.md) |
| 이름 짓기 / 커밋 / 실행·테스트 | [docs/conventions/](docs/conventions/) |
| hooks·skills (AI 작업 도구) | [docs/conventions/harness.md](docs/conventions/harness.md) |
| 문제점·남은 일·결정할 것 | [docs/known-issues.md](docs/known-issues.md) |

도메인 폴더의 `overview.md`부터 읽고, 필요한 것만 `api.md` · `data.md` · `rules.md`를 연다.
`docs/GUIDE.md`는 사람용 안내서다. 작업할 때는 읽지 않아도 된다.

## 3. 작업 원칙

- **스펙이 필요한 작업**: API(주소·필드), DB(테이블·컬럼), 비즈니스 규칙이 바뀌거나 두 파트 이상에 걸친 작업. 버그 수정·UI·문구는 스펙 없이 한다.
- **문서 먼저, 구현 나중.** 바뀔 모습은 스펙의 `design.md`에 먼저 쓰고 사람 승인을 받은 뒤 구현한다.
- **설계와 다르면 멈춘다.** 다른 점·이유·선택지를 사람에게 보고하고, 방향을 받으면 `design.md`의 변경 기록과 `tasks.md`를 먼저 고친 뒤 이어간다.
- 승인된 requirements·design은 사람의 방향 없이 고치지 않는다.
- 작업을 하나 끝낼 때마다 `tasks.md` 체크박스를 채운다.
- 스펙의 마지막 작업은 항상 `docs/domains/*` 반영이다. `domains/`는 구현이 끝난 뒤에만 고친다.
- 스펙 없이 고친 코드가 docs 내용을 바꾸면 같은 변경에서 문서도 고친다.

## 4. 문제점 기록과 찾기

- 문제·할 일·질문은 [docs/known-issues.md](docs/known-issues.md) 한 곳에 ID로 기록한다: ⚠️ `ISSUE-<SEC|BUG|DATA|LIMIT>-N` · ⏳ `TODO-N` · ❓ `ASK-N`
- **known-issues는 main에서만 고치고 바로 main에 올린다.** 브랜치의 사본은 읽지도 고치지도 않는다. 읽기 `python3 scripts/harness/known-issues.py show`, 고치기 `open` → 수정 → `push -m "docs: 요약"` ([decisions/0008](docs/decisions/0008-known-issues-on-main.md))
- 해결 처리는 고친 코드가 main에 병합된 뒤에 한다. 그 전에는 `진행 중`으로 둔다.
- 작업을 시작하면 먼저 `python3 scripts/harness/known-issues.py news`로 지난 확인 이후 바뀐 것을 확인한다 (Claude Code는 세션 시작 때 hook이 자동으로 한다).
- 스펙 design이 승인되면 known-issues "🚧 진행 중 작업" 표에 건드리는 파일을 등록한다. 새 작업 전에는 `known-issues.py overlap`으로 겹침을, 작업 중에는 `known-issues.py drift`로 등록 범위 밖 수정과 main 변경을 확인한다.
- 분류 기준: 지금 쓰면 잘못된 결과·위험 → 문제 / 아직 없을 뿐 → 할 일 / 사람이 정해야 함 → 질문. 애매하면 질문으로 올린다.
- 도메인 문서에는 현재 동작을 그대로 쓰고, 바로 아래에 `> ⚠️ [ISSUE-LIMIT-1](../../known-issues.md#issue-limit-1)` 같은 한 줄만 단다.
- 심각도 "높음"을 새로 기록하면 바로 사람에게 알린다.
- "문제점 알려줘" → `docs/known-issues.md`를 읽고 `grep -rn "ISSUE-" docs/`로 문서 안 위치를 함께 보여준다. "남은 일" → `TODO-`, "결정할 것" → `ASK-`.

## 5. 검증 명령

작업을 끝냈다고 말하기 전에 해당하는 것을 실행한다.

| 대상 | 명령 |
|---|---|
| 백엔드 테스트 | `cd backend && ./gradlew test` |
| 프론트 타입 검사 | `cd frontend && npx tsc --noEmit` |
| 프론트 린트 | `cd frontend && npx expo lint` (ESLint 설정 전) |
| 프론트↔백엔드 API 경로 | `python3 scripts/harness/contract-check.py` |
| 문서 상태 | `python3 scripts/harness/docs-check.py` |

Claude Code에서는 문서·API 파일을 고치면 hook이 위 두 검사를 자동으로 돌린다 ([harness.md](docs/conventions/harness.md)).

## 6. 프론트엔드 (Expo) 주의

- Expo는 SDK마다 API가 바뀐다. 기억에 의존하지 말고 `frontend/package.json`의 `expo` 메이저 버전을 확인한 뒤 `https://docs.expo.dev/versions/v<major>.0.0/`과 `https://docs.expo.dev/llms.txt`를 본다.
- 패키지는 `npx expo install <package>`로 추가한다 (npm/yarn add 대신, SDK 호환 버전).
- 화면 이동은 Expo Router. 라우트 파일은 `frontend/src/app/`에만 두고, 화면 구현은 `src/features/<파트>/screens/`에 둔다.
- 경로 문자열 대신 `src/constants/routes.ts`의 `ROUTES`·`to*()`를 쓴다.
- `ios/`·`android/` 폴더는 자동 생성물이다. 직접 만들거나 고치지 않는다 (설정은 `app.json`).
- 네이티브 코드가 있는 라이브러리를 추가하면 Expo Go가 아니라 개발 빌드가 필요하다.

## 7. 하지 않는 것

- 비밀값(키·비밀번호)을 코드·문서·커밋에 쓰지 않는다. 환경변수 **이름**만 쓴다.
- 노션·PDF 설계를 근거로 코드를 바꾸지 않는다.
- `docs/archive/`에 적힌 과거 기록의 내용을 근거로 삼지 않는다.
- `frontend/scripts/skip-reading.mjs` 같은 개발용 임시 파일을 커밋하지 않는다.
- git push, 브랜치 병합은 사람이 한다. 예외: `docs/known-issues.md` 한 파일만 바꾼 커밋은 AI가 `scripts/harness/known-issues.py push`로 main에 바로 올린다.

## 8. 커밋 메시지

`.cursor/rules/commit-message.mdc` — 제목 `타입: 요약`, 본문 `- ` 목록, 명사로 끝냄, 공동 작성자 줄 없음. 자세히: [docs/conventions/git.md](docs/conventions/git.md)
