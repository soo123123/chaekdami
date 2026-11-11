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
| CommunityScreen | `/fe1/community` | `bookId`(선택, 처음 선택할 완독 도서) |

- 설계 문서의 `/reading/*` 대신 현재 브랜치의 `/fe1/*` 구조를 따른다. 경로 상수는 `constants/routes.ts`.
- `itemId`(외부 YES24 도서)와 `bookId`(내 서재 도서)는 타입부터 분리되어 있다 (`types/reading.ts`).
- 서재 진입점: 아직 홈/탭에서 FE1 화면으로 연결되는 링크가 없다(공용·FE2 파일이라 수정하지 않음). `/fe1/library`로 직접 진입한다.
- 하단 탭바: 공용 컴포넌트 `src/components/BottomTabBar.tsx`. FE1은 UI 시안대로 서재 화면(`LibraryScreen`)과 커뮤니티 화면(`CommunityScreen`) 맨 아래에 직접 붙인다. 레이아웃에 두면 화면 전환 때 탭바가 사라지면서 서재 높이가 바뀌어 책장 크기가 흔들리기 때문이다. 탭 경로는 경로는 파일 안 `TABS`의 `href`에서 지정한다. FE2는 화면/레이아웃 맨 아래에 `<BottomTabBar active="mypage" />`처럼 추가해서 쓸 수 있다.

## 폴더

```
features/fe1/
├── api/readingApi.ts         # 화면/Hook이 사용하는 유일한 API 진입점
├── api/devMockReadingApi.ts   # ⚠️ 개발 전용 Mock (실제 API 아님)
├── components/{common,book,reading,library}
├── constants/{theme,options,routes,config}.ts
├── hooks/{common,book,library,reading}
├── screens/
├── types/reading.ts
└── utils/{format,validation,apiError}.ts
```

## API 연동 상태

백엔드에 도서/독서 API가 아직 없어 `api/readingApi.ts`의 HTTP 구현은 **Endpoint를 임의로 만들지 않고** `ContractPendingError`를 던진다.
개발 중에는 `constants/config.ts`의 `FE1_USE_DEV_MOCK`(기본 `__DEV__`)로 Mock을 사용한다. 프로덕션 빌드에서는 Mock을 사용하지 않는다.

계약이 확정되면 `httpReadingApi`의 각 함수만 구현하고 `FE1_USE_DEV_MOCK`을 `false`로 바꾸면 된다.

## 커뮤니티 (한줄평·평점)

- 백엔드 `be/feat/sentence-review` 브랜치의 `docs/review-api-for-frontend.md` 계약을 따른다. `api/communityApi.ts`의 HTTP 구현은 실제 Endpoint로 작성되어 있고, 해당 브랜치가 main에 병합되기 전까지는 `FE1_USE_DEV_MOCK`으로 `api/devMockCommunityApi.ts`를 쓴다.
- 대상: 내 서재에서 **완독 + ISBN이 있는 책**만. (한줄평·별점 API가 ISBN 기준이라 직접 등록한 책은 제외)
- 리뷰는 책당 1개(별점 필수 + 한줄평 100자·줄바꿈 불가 + 스포일러 여부). 내 리뷰는 목록에서 빼고 '내 한줄평' 카드로 보여준다. 리뷰 삭제 API는 없어서 '한줄평 지우기'는 `oneLine: ""`로 보낸다(별점은 남음).
- 좋아요는 PUT/DELETE, 화면에 먼저 반영 후 실패 시 되돌린다. 신고 사유는 SPOILER/ABUSIVE/SPAM/INAPPROPRIATE/OTHER(기타는 300자 입력 필수).
- 아바타 이미지가 없어 닉네임 첫 글자 원형 아바타를 쓴다(`components/community/InitialAvatar.tsx`).
- 목록 페이지 번호는 0부터(BE1 도서 검색은 1부터라 팀에서 맞출지 결정 필요).

## 미확정 사항 (확정 전 임의 구현 금지)

1. **도서/독서 API 계약** — 검색, 외부 도서 상세, 책 등록(검색/수동), 서재 목록, 상세, 삭제, 독서 기록 저장의 Method·Endpoint·Request/Response·오류 형식.
2. **인증** — Authorization 헤더 vs 로그인 전 임시 `X-User-Id` 헤더. `apiClient` 인터셉터에서 처리 예정.
3. **이미지 업로드** — 수동 등록 표지, 독서 기록 사진. 업로드 방식·형식·크기 미정이며 `expo-image-picker`도 아직 설치되지 않아 버튼은 안내 문구만 표시한다.
4. **독서 시간 단위** — 현재 `readingTime`/`elapsedTime`은 **초** 단위로 다룬다.
5. **FE2 완료 화면** — 저장 성공 시 `toReadingComplete({ readingRecordId, bookId, durationMinutes, pagesRead })`로 `/fe2/reading/reading-complete`에 이동한다(replace). 집중도·코인·레벨·D-day 등 나머지 전달 데이터는 FE2와 협의 필요. 완료 화면 이미지(`assets/images/reading-complete/`)는 FE2 원본이 오기 전까지 FE2 다른 화면 이미지로 임시 대체.
6. **통계(readingSummary, readingTimeSummary)** — FE2 담당. 제공 방식 확정 전까지 `null`이면 `-`로 표시한다.
7. **서재 테마** — 테마 목록 출처(서버/클라이언트), 저장 API, 테마 이미지 에셋. 에셋이 없어 팔레트로 그린 책장으로 미리보기를 제공한다.
8. **검증 규칙** — 목표 날짜(오늘 이후)·목표 페이지(현재 페이지 초과 ~ 전체 이하)·인상 깊은 문장(최대 500자)은 임시 규칙. 백엔드와 확정 필요.
9. **완독한 책의 버튼 규칙** — 현재는 '다시 읽기'로 독서 시작을 허용한다.
10. **최근 검색어 저장 위치** — 현재 앱 실행 중 메모리에만 보관한다.
11. **책 삭제 시 독서 기록 처리** — 함께 삭제되는지 백엔드 확인 필요 (확인 모달 문구에 영향).
