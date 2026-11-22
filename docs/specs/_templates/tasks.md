> 상태: draft · 작성: YYYY-MM-DD · 기준: <브랜치>@<커밋> · 담당: <역할>
> 요구사항: [requirements.md](./requirements.md) · 설계: [design.md](./design.md)

# NNN · <스펙 이름> — Tasks

**진행 규칙**
- 위에서부터 순서대로 한다. 끝난 작업은 체크한다.
- 작업 하나는 한 번에 끝나고 바로 검증할 수 있는 크기로 쪼갠다.
- 설계와 다르게 해야 하면 멈추고 보고한다. (S10)

<!--
형식:
- [ ] <단계>.<번호> <할 일> — R<번호>
      검증: <실행할 명령 또는 확인 방법>
-->

## 1. <단계 이름>

- [ ] 1.1  — R1.1
      검증: 
- [ ] 1.2  — R1.2
      검증: 

## 2. <단계 이름>

- [ ] 2.1  — R2.1
      검증: 

## 9. 마무리

- [ ] 9.1 전체 테스트 — 검증: `cd backend && ./gradlew test`
- [ ] 9.2 계약 검사 — 검증: `python3 scripts/harness/contract-check.py`
- [ ] 9.3 **docs 반영**: design ④의 문서 전부 수정 — 검증: `python3 scripts/harness/docs-check.py`
- [ ] 9.4 상태 줄을 done으로, `docs/specs/README.md` 목록 갱신
