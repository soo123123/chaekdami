> 기준: fix/fe1@ef397a6 · 최종 확인: 2026-11-22 · 담당: BE1

# 0001 · DB를 MySQL에서 PostgreSQL(Supabase)로

- 상태: 채택 · 날짜 ❓ · 결정: BE 팀

## 예전 설계
구조 가이드·API/DB 설계서·초기 README에 MySQL로 적혀 있었다.

## 바꾼 이유
팀이 원격 DB를 함께 쓰기 위해 Supabase(PostgreSQL)를 선택했다. 각자 DB를 띄우지 않아도 된다.

## 지금 방식
- `spring.profiles.active=dev` → Supabase Session pooler 연결, 주소·사용자명·비밀번호는 `DB_URL`·`DB_USERNAME`·`DB_PASSWORD`
- `local` 프로필은 `LOCAL_DB_*` 환경변수로 로컬 DB 사용
- 테이블은 JPA `ddl-auto=update`로 생성 (마이그레이션 파일 없음)

## 영향
- PostgreSQL 전용 문법을 쓰는 곳이 있다 (예: 좋아요·신고 `insert … on conflict do nothing`, 잠금 대기 `lock_timeout`)
- Supabase 무료 플랜은 오래 안 쓰면 일시정지된다 → [conventions/testing.md](../conventions/testing.md)
