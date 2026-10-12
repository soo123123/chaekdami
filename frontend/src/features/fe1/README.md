# FE1 — 독서 도메인 화면

## 화면과 라우트

| 화면 | 라우트 | 파라미터 |
|---|---|---|
| BookSearchScreen | `/fe1/book-search` | - |
| BookInfoScreen | `/fe1/book-info` | `itemId` |
| BookRegisterScreen | `/fe1/book-register` | `itemId` |
| ManualRegisterScreen | `/fe1/manual-register` | - |
| LibraryScreen | `/fe1/library` | - |
| LibraryCustomizeScreen | `/fe1/library-customize` | - |
| BookDetailScreen | `/fe1/book-detail` | `bookId` |
| ReadingStartScreen | `/fe1/reading-start` | `bookId` |
| ReadingEndScreen | `/fe1/reading-end` | `bookId`, `elapsedTime`(초) |

- 설계 문서의 `/reading/*` 대신 현재 브랜치의 `/fe1/*` 구조를 따른다. 경로 상수는 `constants/routes.ts`.
- `itemId`(외부 YES24 도서)와 `bookId`(내 서재 도서)는 타입부터 분리되어 있다 (`types/reading.ts`).
- 서재 진입점: 아직 홈/탭에서 FE1 화면으로 연결되는 링크가 없다(공용·FE2 파일이라 수정하지 않음). `/fe1/library`로 직접 진입한다.

## 폴더

```
features/fe1/
├── api/devMockReadingApi.ts   # ⚠️ 개발 전용 Mock (실제 API 아님)
├── components/{common,book,reading,library}
├── constants/{theme,options,routes,config}.ts
├── hooks/{common,book,library,reading}
├── screens/
├── types/reading.ts
└── utils/{format,validation,apiError}.ts
api/readingApi.ts               # 화면/Hook이 사용하는 유일한 API 진입점
```

## API 연동 상태

백엔드에 도서/독서 API가 아직 없어 `api/readingApi.ts`의 HTTP 구현은 **Endpoint를 임의로 만들지 않고** `ContractPendingError`를 던진다.
개발 중에는 `constants/config.ts`의 `FE1_USE_DEV_MOCK`(기본 `__DEV__`)로 Mock을 사용한다. 프로덕션 빌드에서는 Mock을 사용하지 않는다.

계약이 확정되면 `httpReadingApi`의 각 함수만 구현하고 `FE1_USE_DEV_MOCK`을 `false`로 바꾸면 된다.

## 미확정 사항 (확정 전 임의 구현 금지)

1. **도서/독서 API 계약** — 검색, 외부 도서 상세, 책 등록(검색/수동), 서재 목록, 상세, 삭제, 독서 기록 저장의 Method·Endpoint·Request/Response·오류 형식.
2. **인증** — Authorization 헤더 vs 로그인 전 임시 `X-User-Id` 헤더. `apiClient` 인터셉터에서 처리 예정.
3. **이미지 업로드** — 수동 등록 표지, 독서 기록 사진. 업로드 방식·형식·크기 미정이며 `expo-image-picker`도 아직 설치되지 않아 버튼은 안내 문구만 표시한다.
4. **독서 시간 단위** — 현재 `readingTime`/`elapsedTime`은 **초** 단위로 다룬다.
5. **FE2 완료 화면** — `ReadingCompleteScreen` 경로·전달 데이터 미합의. `READING_COMPLETE_ROUTE = null`이며, 그동안은 저장 성공 후 완료 상태를 이 화면에서 표시한다.
6. **통계(readingSummary, readingTimeSummary)** — FE2 담당. 제공 방식 확정 전까지 `null`이면 `-`로 표시한다.
7. **서재 테마** — 테마 목록 출처(서버/클라이언트), 저장 API, 테마 이미지 에셋. 에셋이 없어 팔레트로 그린 책장으로 미리보기를 제공한다.
8. **검증 규칙** — 목표 날짜(오늘 이후)·목표 페이지(현재 페이지 초과 ~ 전체 이하)·인상 깊은 문장(최대 500자)은 임시 규칙. 백엔드와 확정 필요.
9. **완독한 책의 버튼 규칙** — 현재는 '다시 읽기'로 독서 시작을 허용한다.
10. **최근 검색어 저장 위치** — 현재 앱 실행 중 메모리에만 보관한다.
11. **책 삭제 시 독서 기록 처리** — 함께 삭제되는지 백엔드 확인 필요 (확인 모달 문구에 영향).
