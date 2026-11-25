> 상태: draft (구현 전) · 작성: 2026-11-25 · 기준: main@4cc8ce1 · 담당: BE2 (+FE2)
> 요구사항: [requirements.md](./requirements.md) · 설계: [design.md](./design.md)

# 016 · 상점 구매 중복 방지 — Tasks

**진행 규칙**
- 위에서부터 순서대로 한다. 끝난 작업은 체크한다.
- 설계와 다르게 해야 하면 멈추고 보고한다. (S10)
- 3(앱)은 2(서버)와 순서에 관계없이 할 수 있다.

## 1. 시작 전

- [ ] 1.1 FE2의 설계 확인을 받고 design 상태를 approved로 바꾸기
      검증: design 상태 줄

## 2. 서버 (BE2)

- [ ] 2.1 고치기 전에 응답이 끊긴 뒤 다시 구매하는 상황을 H2로 재현 — R1.2
      검증: `ShopPurchaseConcurrencyTest`가 고치기 전 코드에서 실패
- [ ] 2.2 `SHOP_002` 추가, `ShopService.purchase`의 음수 검사와 개수 비교 — R1.1~R1.8
      검증: `ShopServiceTest`
- [ ] 2.3 `PurchaseRequest`와 컨트롤러 — R1.6~R1.8
      검증: `ShopControllerTest` (본문 없음, `null`, 값 있음, 음수, 숫자 아님)
- [ ] 2.4 동시 요청과 재시도 테스트 — R1.2~R1.4
      검증: `ShopPurchaseConcurrencyTest`, 개수 비교를 빼면 실패하는지 확인

## 3. 앱 (FE2)

- [ ] 3.1 구매 요청에 그 상품의 보유 개수 전송 — R2.1
      검증: `cd frontend && npx tsc --noEmit`
- [ ] 3.2 실패 뒤 다시 조회한 개수로 안내, 자동 재시도 없음 — R2.2~R2.4
      검증: 개발 환경에서 409와 응답 끊김 확인

## 9. 마무리

- [ ] 9.1 전체 테스트 — 검증: `cd backend && ./gradlew test`
- [ ] 9.2 계약 검사 — 검증: `python3 scripts/harness/contract-check.py`
- [ ] 9.3 실제 PostgreSQL에서 동시 요청 확인 — R1.3
- [ ] 9.4 **docs 반영**: design ④의 문서 전부 수정 — 검증: `python3 scripts/harness/docs-check.py`
- [ ] 9.5 상태 줄을 done으로, `docs/specs/README.md` 목록 갱신
