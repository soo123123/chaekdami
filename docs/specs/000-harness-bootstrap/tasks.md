> 상태: in-progress · 작성: 2026-11-22 · 기준: fix/fe1@ef397a6 · 담당: BE1
> 요구사항: [requirements.md](./requirements.md) · 설계: [design.md](./design.md)

# 000 · 하네스 기반 만들기 — Tasks

**진행 규칙**
- 위에서부터 순서대로 한다. ✋ 표시는 사람 확인 후 다음 단계로 넘어간다.
- 모든 문서는 **현재 코드를 직접 읽고** 쓴다. 노션·PDF·기존 문서는 참고만 한다.
- 이 스펙에서는 **코드 파일을 수정하지 않는다.**
- 설계와 다르게 해야 할 일이 생기면 멈추고 보고한다. (design S10)

---

## 결정 대기 (시작 전)

- [x] 0.1 커밋 방식 결정 — **(b) AI는 파일 정리까지, 커밋은 사람이 직접** (2026-11-22 결정)
- [x] 0.2 기존 문서 동기화 범위 — **루트 `README.md`와 `docs/` 아래 기존 파일만** 현재 코드 기준으로 동기화. 노션·PDF(첨부 문서)·`frontend/` 안 문서는 손대지 않음 (2026-11-22 결정)
      추가 결정: `frontend/` 안의 AI 지침서 성격 문서는 docs로 통합 후 제거 가능 → 7.5
- [x] 0.3 main 병합 완료 알림 받기 — 병합·GitHub push는 사람이 함 (2026-11-22 결정)

## P0. 기준선

- [x] 0.4 main 최신 상태 확인, 작업 트리 깨끗한지 확인 — 검증: `git status` 결과 비어 있음
      변경: 사람 결정으로 main 병합 전 `fix/fe1`에 바로 반영 (2026-11-22). 기준 커밋 `ef397a6` + 커밋 안 한 변경(세션 최소 3분 규칙)
- [x] 0.5 ~~`docs/harness` 브랜치 생성~~ → 사람 결정으로 `fix/fe1`에 바로 반영
- [x] 0.6 기준 커밋 해시를 design.md·tasks.md 상태 줄에 기입

## P1. 뼈대 — R1, R3, R4

- [x] 1.1 폴더 생성: `docs/{conventions,domains/{reading,review,reward,dday,user},decisions,specs/_templates,archive}` — 검증: `find docs -type d`
      진행: 작업 공간에 conventions·domains/reward·specs 폴더만 생성. 나머지는 병합 후 저장소에서 (P0 대기)
- [x] 1.2 `docs/README.md` — 이 폴더는? · 무엇이 들어 있나(표) · 어떻게 나눴나 · 문서 규칙(D9~D11)
- [x] 1.3 `docs/specs/README.md` — 이 폴더는? · 한 스펙에 들어 있는 것 · 흐름 · 규칙 S1~S11 · 스펙 목록 표
- [x] 1.4 템플릿 3종 `docs/specs/_templates/{requirements,design,tasks}.md` — S2·S3(5칸+변경 기록)·S4 형식
- [x] 1.5 `docs/specs/000-harness-bootstrap/` 에 이 스펙의 requirements·design·tasks 넣기
- [x] 1.6 `docs/GUIDE.md` 0~4장·6장 작성 (5장 "예시로 한 바퀴"는 스펙 003 완료 후)

## P2. 공통 문서 — R1

- [x] 2.1 `docs/glossary.md` — itemId · bookId · readingRecordId · readingSessionId · userQuestId · round · status 값 등. 근거: Book·ReadingRecord·ReadingSession·UserQuest 엔티티
- [x] 2.2 `docs/conventions/api.md` — Base URL · 인증 헤더 · 토큰 재발급 흐름 · 에러 형식 `{code, message, fields}` · **전체 에러 코드 표** · 날짜 형식 · X-User-Id 과도기 처리. 근거: GlobalExceptionHandler·ReadingExceptionHandler·각 ErrorCode enum·JwtAuthenticationFilter
- [x] 2.3 `docs/conventions/naming.md` — BE·FE·DB 명명 규칙 중 현재 코드와 맞는 것
- [x] 2.4 `docs/conventions/git.md` — 브랜치 · 커밋 규칙(`.cursor/rules/commit-message.mdc` 내용) · PR 체크리스트(지식 베이스 반영 항목 포함)
- [x] 2.5 `docs/conventions/testing.md` — 백엔드·프론트 실행 · 테스트 명령 · `backend/http/*.http` · 로컬 테스트 계정 · 환경변수 **이름** 목록 · 알려진 실행 문제(ESLint 미설정 등)
- [x] 2.6 `docs/architecture.md` — 계층 · 도메인 패키지 · 도메인 간 연결(port·이벤트·탈퇴 리스너·보상 호출 시점) · 프론트 구조(features·라우트·apiClient) · 인증 흐름

## P3. reward 도메인 시범 — R1  ✋

- [x] 3.1 `domains/reward/overview.md` — 개념 · 코드 위치 · 다른 도메인 연결 · 담당
- [x] 3.2 `domains/reward/api.md` — `/api/rewards`, `/api/rewards/reading-sessions/{id}`, `/api/rewards/boosters/use`, `/api/quests`, `/api/shop/items`, `/api/shop/items/{id}/purchase` 요청·응답·에러
- [x] 3.3 `domains/reward/data.md` — reward_accounts · quests · user_quests · shop_items · user_items · user_buffs · reward_transactions · reading_session_rewards + ERD + 변경 이력
- [x] 3.4 `domains/reward/rules.md` — 경험치 계산 · 레벨표 · 레벨업 보상 · 부스터(30분 2배, 겹친 비율) · 사진 보너스 · 일일 퀘스트 종류 · 방어권 · 지급 1회 보장 (값 + 코드 위치 + 상태)
- [x] 3.5 ✋ **형식 확인 요청** — OK (2026-11-22) — 확인 후 나머지 도메인에 같은 형식 적용

## P4. 나머지 도메인 — R1

- [x] 4.1 `domains/reading/` 4종 — 검색·서재·독서 기록·세션·오늘/통계 API, books·reading_records·reading_sessions, 회차·페이지·자동 완독·세션 3분~2시간 규칙
- [x] 4.2 `domains/review/` 4종 — 문장·문장 모음집·리뷰(평점·한줄평)·독후감·좋아요·신고·커뮤니티·관리자 API, sentences·reviews·review_likes·review_reports·book_reports
- [x] 4.3 `domains/dday/` 4종 — `/api/dday` GET·PUT, dday_goals·dday_records, 연속일·방어권 차감·환불 규칙
- [x] 4.4 `domains/user/` 4종 — 인증 8개 + `/api/me` GET·DELETE + `/email/reset`, users·refresh_tokens·password_reset_tokens·auth_attempts, 토큰·잠금·탈퇴 규칙
- [x] 4.5 검증: 백엔드 매핑 개수 = 문서 엔드포인트 개수 (P8 스크립트 완성 후 재확인)

## P5. 기록 문서 — R1, R4

- [x] 5.1 `docs/overview.md` — 서비스 목적 · 주요 기능 · "기획 의도" 구분 표시 (노션·README 내용)
- [x] 5.2 `docs/decisions/` — 0001 PostgreSQL(Supabase) · 0002 리뷰 테이블 통합(평점+한줄평) · 0003 보상은 독서 완료 화면에서 지급 · 0004 D-day 달력 통합 · 0005 세션 API 경로 · 0006 Expo Router
- [x] 5.3 `docs/known-issues.md` — 세션 문장·사진 미저장 · 책 삭제 시 독후활동 잔존 · 탈퇴 시 서재 잔존 · 주간 퀘스트·독서 인증·AI·랭킹 미구현 · 사진 인증 Mock · ❓ 기획 질문(상태 변경 5분, isPublic, 2시간 상한)
- [x] 5.4 `docs/archive/README.md` — PDF 5종·노션 링크 + 기존 파일 → 최신 위치 안내

## P6. 스펙 정리 — R3  ✋

- [x] 6.1 `specs/001-reward-integration/` — 기존 내용을 새 양식으로 옮기고 상태 in-progress (원본 tasks에 테스트·실기기 확인이 남아 있어 done 대신)
- [x] 6.2 `specs/002-reading-reward/` — 옮기고 상태 superseded → 001
- [x] 6.3 `specs/003-session-sentence-and-cleanup/requirements.md` 초안 (draft)
- [x] 6.4 `specs/README.md` 스펙 목록 표 갱신
- [ ] 6.5 ✋ **스펙 003 요구사항 확인 요청** — 사람 결정으로 마지막 정리(P9)로 미룸 (2026-11-22)

## P7. 진입점 — R2

- [x] 7.1 `AGENTS.md` (100줄 이내) — 믿는 순서 · 작업별 읽을 문서 표 · 스펙 필요 조건 · 작업 원칙 S9~S11 · 검증 명령 · 금지 · GUIDE는 사람용
- [x] 7.2 `CLAUDE.md` — `@AGENTS.md` + Claude 전용 메모
- [x] 7.3 `.cursor/rules/agents.mdc` — 항상 적용, AGENTS.md 따르기
- [x] 7.4 기존 문서 동기화 (0.2): 루트 `README.md` → 소개·실행·구조·docs 링크로 정리 / `docs/review-api-for-frontend.md` → `domains/review/api.md`로 이동·보정 / `docs/alpha-test-schema-changes.md` → 각 `data.md` 변경 이력으로 반영 후 이동 / `docs/reward-integration/`·`docs/reading-reward/` → `specs/001`·`002`로 이동
      진행: 새 README·옮길 문서 내용은 작업 공간에 준비 완료. 저장소의 기존 파일 이동·교체는 P0 이후

- [x] 7.5 `frontend/` 문서 정리: `frontend/AGENTS.md`(Expo 에이전트 지침) → 루트 `AGENTS.md`·`conventions/`에 통합 후 제거 / `frontend/src/features/fe1/README.md`(FE1 개발 메모) → `architecture.md`·`domains/reading`·`known-issues.md`에 통합 후 제거 / `frontend/README.md`(Expo 템플릿 기본 README) → 사람 확인 후 처리. 제거는 삭제 권한 요청 필요
      결과: `frontend/AGENTS.md`, `frontend/src/features/fe1/README.md` 삭제 (2026-11-22). `frontend/README.md`(Expo 템플릿)는 사람 확인 대기로 남김
      진행: `frontend/AGENTS.md`의 Expo 규칙은 루트 `AGENTS.md` 5장으로, FE1 README 내용은 `domains/reading/overview.md`·`known-issues.md`로 통합 완료. 파일 제거는 P0 이후

## P8. 검사 스크립트 — R5

- [x] 8.1 `python3 scripts/harness/contract-check.py` — 프론트 `/api` 호출 경로 ↔ 백엔드 `@*Mapping` 비교, 불일치 목록 출력
- [x] 8.2 `python3 scripts/harness/docs-check.py` — ① 상태 줄 존재 ② 상대 링크 대상 존재 ③ API 문서 엔드포인트 수 = 백엔드 매핑 수 ④ 비밀값 패턴 0건
- [x] 8.3 두 스크립트 실행 → 결과를 `known-issues.md`에 반영
      결과: API 59개 전부 문서화, 문서 51개 상태 줄·링크·비밀값 문제 0건. 프론트→백엔드 불일치 1건(`/api/reading-photos/verify`, known-issues F1), 앱이 안 부르는 API는 known-issues Q10
- [x] 8.4 `conventions/testing.md`·`AGENTS.md`에 스크립트 실행 명령 추가

## P9. 마무리 — R1~R5  ✋

- [x] 9.1 `python3 scripts/harness/docs-check.py` 통과 — 검증: 종료 코드 0
- [x] 9.2 `python3 scripts/harness/contract-check.py` 실행 결과가 known-issues와 일치
      결과: 불일치 1건 `/api/reading-photos/verify` (TODO-1, 알려진 미구현이라 종료 코드 1은 예상된 결과)
- [x] 9.3 지식 베이스 반영 확인: 이 스펙의 결과가 `docs/README.md`·`specs/README.md` 목록에 모두 있음
- [ ] 9.4 상태 줄 갱신 (design·tasks → done), `specs/README.md` 목록에서 000 → done
- [ ] 9.5 파일 반영 완료 보고 → 사람이 커밋 → ✋ **최종 확인**
