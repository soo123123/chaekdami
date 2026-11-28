> 상태: in-progress · 작성: 2026-11-25 · 기준: main@4cc8ce1 · 담당: BE2 · 승인: BE2(2026-11-25), FE2(2026-11-25, 메시지에 체크 반응)
> 요구사항: [requirements.md](./requirements.md)

# 016 · 상점 구매 중복 방지 — Design

## ① 흐름

```
[상점] ── POST /api/shop/items/{itemId}/purchase {"purchaseQuantity": 1, "ownedQuantity": 2}
        ─▶ ShopController ─▶ ShopService.purchase
  1. 구매 수량이 1~99가 아니거나 ownedQuantity가 음수면 400 VALIDATION_ERROR       R1.7
  2. 판매 중인 상품이 아니면 404 SHOP_001 (지금과 같음)
  3. 보상 계정 잠금 (지금과 같음. 같은 사용자의 요청을 하나씩 처리)                  R1.3
  4. ownedQuantity가 있으면 그 상품의 서버 보유 개수(없으면 0)와 비교
     → 다르면 409 SHOP_002                                                      R1.2, R1.5, R1.8
     없으면 비교하지 않음                                                         R1.6
  5. 재화가 부족하면 400 REWARD_001                                              R1.4
  6. 재화 차감, 보유 개수 증가, 응답 (지금과 같음)                                  R1.1

[상점] 실패 시 (앱. 문구와 처리 기준은 PR 55의 부스터와 맞춘다)
  재화와 보유 개수 다시 조회 (409 포함, 자동으로 다시 구매하지 않음)                R2.2
  ├ 그 상품의 개수가 보낸 개수보다 늘었음 → "이미 구매됐어요. 보유 N개"              R2.3
  ├ 응답 끊김·5xx·409 SHOP_002이고 개수가 줄었음 → "보유 개수가 바뀌었어요. 보유 N개"
  ├ 그 밖 → 서버 메시지 (5xx이거나 메시지가 없으면 "구매에 실패했어요.")
  └ 조회 실패 → 응답 끊김·5xx·409 SHOP_002이면                                   R2.4
      "구매 결과를 확인하지 못했어요. 잠시 후 다시 확인해 주세요."
```

개수 비교는 반드시 **잠근 뒤, "재화 부족"보다 먼저** 한다.

### 상황별 결과

| 상황 (200 재화짜리 1개 구매) | 앱 개수 | 서버 개수 | 결과 |
|---|---|---|---|
| 처음 구매 | 2 | 2 | 200, 3개, 재화 200 차감 |
| 처리됐는데 응답이 끊겨 다시 구매 | 2 | 3 | 409 SHOP_002, 재화 그대로 |
| 재시도가 먼저 처리되고 처음 요청이 늦게 도착 | 2 | 3 | 409 SHOP_002 |
| 첫 구매로 재화를 다 쓴 뒤 다시 구매 | 2 | 3 | 409 SHOP_002 (REWARD_001 아님) |
| 처음 사는 상품 | 0 | 없음 | 200 |
| 개수를 안 보냄 | — | 2 | 200 (지금과 같음) |

## ② 바뀌는 것

| 구분 | 변경 | 관련 R |
|---|---|---|
| API 요청 | `POST /api/shop/items/{itemId}/purchase` 본문에 `ownedQuantity` 추가. 정수, 선택. 본문이 없거나 값이 `null`이면 비교하지 않는다 | R1.1, R1.6, R2.1 |
| API 응답 | 성공 응답은 바뀌지 않음 | R1.1 |
| API 오류 | `409 SHOP_002` "상품 보유 개수가 달라졌습니다. 개수를 확인해 주세요." 추가. 요청이 겹쳤을 때의 `409 CONCURRENCY_001`은 그대로 | R1.2, R1.8 |
| API 오류 | `ownedQuantity`가 음수거나 정수로 읽을 수 없으면 `400 VALIDATION_ERROR` | R1.7 |
| DB | 없음 | |
| 비즈니스 규칙 | 앱이 아는 그 상품의 보유 개수와 서버의 개수가 다르면 구매하지 않는다 | R1.2 |

`ownedQuantity`에는 `GET /api/shop/items` 응답에서 **구매할 그 상품**의 `ownedQuantity`(없으면 0)를 보낸다. 스펙 015의 부스터 사용은 부스터 상품을 모두 더한 값이라 서로 다르다.

## ③ 수정할 파일

| 파일 | 변경 내용 |
|---|---|
| `backend/.../reward/presentation/dto/PurchaseRequest.java` | `ownedQuantity` 추가 |
| `backend/.../reward/presentation/ShopController.java` | `ownedQuantity`를 서비스에 전달 |
| `backend/.../reward/application/ShopService.java` | `purchase`에 `ownedQuantity` 추가, 음수 검사, 잠근 뒤 개수 비교 |
| `backend/.../reward/domain/RewardErrorCode.java` | `ITEM_COUNT_CHANGED("SHOP_002", 409, ...)` |
| `backend/src/test/.../reward/application/ShopServiceTest.java` | R1.1, R1.2, R1.4~R1.7 |
| `backend/src/test/.../reward/application/ShopPurchaseConcurrencyTest.java` | (새 파일) H2로 동시 요청과 응답 끊김 뒤 재시도 (R1.2~R1.4) |
| `backend/src/test/.../reward/presentation/ShopControllerTest.java` | (새 파일) 본문이 없을 때·있을 때, 오류 코드 (R1.6~R1.8) |
| `frontend/src/features/fe2/api/rewardApi.ts` | (FE2) `purchaseItem`이 `ownedQuantity` 전송 |
| `frontend/src/features/fe2/screens/ShopScreen.tsx` | (FE2) 보유 개수 전달, 실패 뒤 개수 비교와 안내 |

## ④ 고칠 docs 문서

- [x] `docs/domains/reward/api.md` — 구매 요청 본문, `SHOP_002`
- [x] `docs/domains/reward/rules.md` — 상점 개수 비교 규칙
- [ ] `docs/known-issues.md` — 서버와 앱이 모두 main에 병합된 뒤 ISSUE-BUG-35 해결 처리 (main에서)

## ⑤ 남은 질문 (❓)

- FE2: 안내 문구와 앱 수정 일정 (필드 이름과 에러 코드는 동의, 2026-11-25). 서버와 앱은 어느 쪽을 먼저 병합해도 된다 (지금 서버는 모르는 필드를 쓰지 않는다). 409 확인은 서버 병합 뒤에 한다.

### 순서와 알려진 한계

- 서버 구현은 009를 기다리지 않는다. `RewardErrorCode`는 스펙 015 서버와, `rewardApi.ts`는 PR 55·009·015의 앱 작업과 겹친다. 나중에 병합하는 쪽이 맞춘다.
- `ShopScreen.tsx`는 FE2의 `fix/fe2-level-stats-lint`도 고치고 있어 FE2가 순서를 정한다.
- 서버만 병합된 상태에서는 중복을 막지 못한다 (R1.6). 서버와 앱이 모두 병합돼야 해결이다.
- 상점을 열 때 보상 조회(방어권 자동 정산)와 상품 조회를 동시에 보내므로, 방어권이 자동으로 쓰인 날은 첫 구매가 한 번 409가 될 수 있다. 다시 조회하면 구매할 수 있고 재화는 차감되지 않는다.
- 방어권이 자동으로 쓰여 개수가 다시 같아진 경우와 여러 기기에서 개수가 우연히 같아진 경우는 막지 못한다 (requirements 3).

---

## 변경 기록

| 날짜 | 바뀐 내용 | 이유 | 결정 |
|---|---|---|---|
| | | | |
