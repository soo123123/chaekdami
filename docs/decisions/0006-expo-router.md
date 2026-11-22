> 기준: fix/fe1@ef397a6 · 최종 확인: 2026-11-22 · 담당: BE1

# 0006 · 화면 이동은 Expo Router, 라우트는 /fe1·/fe2

- 상태: 채택 · 결정: FE1·FE2

## 예전 설계
초기 README·노션: React Navigation. 아키텍처 설계서 라우트 표: `/reading/search`, `/reward/quest` 등. 첫 화면은 로그인.

## 바꾼 이유
Expo 템플릿이 파일 기반 라우팅(Expo Router)을 기본으로 쓰고, 두 프론트 담당이 폴더를 나눠 충돌 없이 작업하기 위해 파트별 경로를 썼다.

## 지금 방식
- 라우트 파일은 `frontend/src/app/`, 화면 구현은 `features/fe1·fe2/screens`
- 경로: `/fe1/*`(서재·독서·커뮤니티), `/fe2/*`(홈 외 FE2 화면), `/auth/*`
- `/`는 홈이고 토큰이 없으면 `/auth/login`으로 보낸다
- 경로 문자열 대신 `src/constants/routes.ts`의 `ROUTES`·`to*()` 사용

## 영향
- 경로가 기능이 아니라 담당 파트로 나뉘어 있다. 나중에 정리하려면 `routes.ts`와 `src/app/` 파일을 함께 옮긴다
- 자세히: [architecture.md](../architecture.md#5-프론트엔드)
