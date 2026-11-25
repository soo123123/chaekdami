> 상태: done · 작성: 2026-11-25 · 기준: feature/be3-community-report@18c811c · 담당: BE3
> 요구사항: [requirements.md](./requirements.md) · 설계: [design.md](./design.md)

# 012 · 공개 독후감·문장의 신고와 블라인드 — Tasks

**진행 규칙**
- 위에서부터 순서대로 한다. 끝난 작업은 체크한다.
- 작업 하나는 한 번에 끝나고 바로 검증할 수 있는 크기로 쪼갠다.
- 설계와 다르게 해야 하면 멈추고 보고한다. (S10)

## 1. DB·저장소

- [x] 1.1 `BookReport`·`Sentence` 컬럼, `BookReportReport`·`SentenceReport` — R2.6, R2.8, R5.1
      검증: `CommunityReportTest` (이전 모양의 테이블에서 시작)
- [x] 1.2 리포지토리의 신고 수·블라인드 UPDATE, 관리자 목록 — R2.1, R2.7, R3
      검증: `CommunityReportTest`

## 2. 조회

- [x] 2.1 커뮤니티에서 가려진 글·정지 회원 제외 — R2.2~R2.4, R4.1, R4.3, R4.4
      검증: `CommunityReportTest`, `CommunityServiceTest`
- [x] 2.2 공개 한줄평에서 정지 회원 제외 — R4.2, R4.5
      검증: `CommunityReportTest`, `ReviewSocialServiceTest`
- [x] 2.3 내 글 응답에 `isBlinded` — R2.5
      검증: `CommunityReportTest`

## 3. 신고·관리자

- [x] 3.1 `ReportQuota`·`ReportRules`, `CommunityReportService`·Controller — R1
      검증: `CommunityReportTest`, `ReviewReportLimitTest`
- [x] 3.2 `CommunityAdminService`·Controller — R3, R4.6
      검증: `CommunityReportTest`
- [x] 3.3 탈퇴한 신고자의 신고 삭제 — R5.2
      검증: `ReviewCleanupServiceTest`, `CommunityReportTest`
- [x] 3.4 `backend/http/review.http` — R6.1
      검증: 파일 확인

## 9. 마무리

- [x] 9.1 전체 테스트 — 검증: `cd backend && ./gradlew test`
- [x] 9.2 계약 검사 — 검증: `python3 scripts/harness/contract-check.py`
- [x] 9.3 **docs 반영**: design ④의 `docs/domains/`·`docs/conventions/` 문서 수정 — 검증: `python3 scripts/harness/docs-check.py`
- [x] 9.4 상태 줄을 done으로, `docs/specs/README.md` 목록 갱신
