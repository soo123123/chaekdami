/**
 * FE1 독서 도메인 타입.
 *
 * 식별자 규칙
 * - itemId: 외부 도서(YES24) 검색 결과의 식별자. 검색/책 정보/등록 화면에서만 사용한다.
 * - bookId: 내 서재에 등록된 내부 도서의 식별자. 서재/상세/독서 화면에서 사용한다.
 * 두 값은 서로 대체할 수 없으므로 타입을 분리한다.
 */

export type ItemId = string;
export type BookId = number;

/** 서재 내 독서 상태 */
export type BookStatus = 'READING' | 'COMPLETED' | 'NOT_STARTED';

/** 등록 도서의 출처 */
export type BookSource = 'CATALOG' | 'MANUAL';

/* ------------------------------------------------------------------ */
/* 외부 도서 검색                                                        */
/* ------------------------------------------------------------------ */

export type SearchCategory = 'all' | 'domestic' | 'foreign' | 'ebook';
export type SearchSort = 'accuracy' | 'latest' | 'rating';

/** 외부 도서 검색 결과 항목. 외부 API가 제공하지 않는 값은 undefined로 둔다. */
export type BookSearchItem = {
  itemId: ItemId;
  title: string;
  author: string;
  coverImageUrl?: string;
  publisher?: string;
  publishedDate?: string; // ISO 8601 (yyyy-MM-dd)
  isbn?: string;
  totalPages?: number;
  rating?: number;
  reviewCount?: number;
};

/** 외부 도서 상세 정보 */
export type BookCatalogDetail = BookSearchItem & {
  categories?: string[];
  format?: string;
  description?: string;
  highlight?: string;
  relatedItems?: BookSearchItem[];
};

export type BookSearchQuery = {
  keyword: string;
  category: SearchCategory;
  sort: SearchSort;
};

export type BookSearchResult = {
  totalCount: number;
  items: BookSearchItem[];
};

/* ------------------------------------------------------------------ */
/* 내 서재                                                              */
/* ------------------------------------------------------------------ */

export type RegisteredBook = {
  bookId: BookId;
  source: BookSource;
  itemId?: ItemId;
  title: string;
  author: string;
  publisher?: string;
  publishedDate?: string;
  isbn?: string;
  coverImageUrl?: string;
  categories?: string[];
  format?: string;
  totalPages?: number;
  currentPage: number;
  status: BookStatus;
  isPublic: boolean;
  goalDate?: string;
  goalPage?: number;
  startedAt?: string;
  createdAt: string;
};

export type LibraryFilter = 'all' | BookStatus;
export type LibrarySort = 'recent' | 'title' | 'progress';

/** 인상 깊었던 문장 */
export type Sentence = {
  sentenceId: number;
  content: string;
  page?: number;
  createdAt: string;
};

/**
 * 독서 통계(총 독서 시간, 기간, 평균)는 FE2 담당 범위다.
 * 연동 방식이 확정되기 전까지 화면에서는 null을 허용하고 표시만 담당한다.
 */
export type ReadingSummary = {
  totalReadingSeconds: number;
  readingDays: number;
  averageSecondsPerDay: number;
};

export type ReadingTimeSummary = {
  todaySeconds: number;
  bookSeconds: number;
  weekSeconds: number;
};

/** 책의 회차(1회독, 2회독 …). 독후감은 회차마다 1개다 (FE2 독후감 API의 readingRecordId) */
export type ReadingRound = {
  readingRecordId: number;
  round: number;
  status: BookStatus;
  completedAt?: string;
};

export type BookDetail = {
  book: RegisteredBook;
  readingSummary: ReadingSummary | null;
  sentences: Sentence[];
  /** 이 책의 모든 회차 (최신 회차가 앞) */
  rounds: ReadingRound[];
  /** 가장 최근 회차 (= rounds[0]). 회차가 없으면 null */
  currentRound: ReadingRound | null;
};

/* ------------------------------------------------------------------ */
/* 등록 / 기록 요청                                                     */
/* ------------------------------------------------------------------ */

export type ReadingSettings = {
  currentPage: number;
  totalPages?: number;
  goalDate?: string;
  goalPage?: number;
  isPublic: boolean;
};

export type RegisterCatalogBookRequest = ReadingSettings & {
  itemId: ItemId;
};

export type ManualBookInput = {
  title: string;
  author: string;
  publisher: string;
  publishedDate?: string;
  isbn?: string;
  /** 로컬 이미지 URI. 업로드 방식은 백엔드 계약 확정 후 연결한다. */
  coverImageUri?: string;
};

export type RegisterManualBookRequest = ReadingSettings & {
  book: ManualBookInput;
};

/** 독서 인증 사진의 검증 상태. 검증에 실패한 사진은 바로 지우므로 상태로 두지 않는다. */
export type ReadingPhotoStatus = 'verifying' | 'verified';

/** 독서 종료 화면에 첨부한 인증 사진 (선택, 1장). 이미지는 검증에만 쓰고 저장하지 않는다. */
export type ReadingPhoto = {
  uri: string;
  status: ReadingPhotoStatus;
  /** 검증 통과 시 서버가 발급한 검증 번호 */
  verificationId?: number;
};

export type ReadingRecordRequest = {
  bookId: BookId;
  /** 초 단위 */
  readingTime: number;
  startPage: number;
  endPage: number;
  sentence?: string;
  /** 검증을 통과한 인증 사진의 검증 번호. 사진 인증은 선택이며 이미지 자체는 보내지 않는다. */
  photoVerificationId?: number;
};

/**
 * 독서 기록 저장 결과.
 * readingRecordId는 저장 1건의 ID가 아니라 '회차'(1회독, 2회독) ID다 (백엔드 reading_records.id).
 * 같은 회차를 여러 번 나눠 읽으면 같은 ID가 오고, 완독 후 다시 읽으면 새 회차 ID가 온다.
 * 독후감(FE2)은 이 회차 ID 기준으로 1개씩 쓴다.
 */
export type ReadingRecordResult = {
  readingRecordId: number;
  /** 몇 회독인지 (1부터) */
  round: number;
  /** 이번 저장으로 이 회차가 완독 상태인지 */
  isCompleted: boolean;
  /** 저장된 독서 세션 번호. 독서 완료 화면이 보상(POST /api/rewards/reading-sessions/{id})을 받을 때 쓴다. Mock 저장이면 없음 */
  sessionId?: number | null;
};

/* ------------------------------------------------------------------ */
/* 서재 테마                                                            */
/* ------------------------------------------------------------------ */

export type ThemeCategory = 'all' | 'warm' | 'modern' | 'nature' | 'mood';

export type LibraryTheme = {
  themeId: string;
  name: string;
  description: string;
  category: Exclude<ThemeCategory, 'all'>;
  palette: {
    wall: string;
    shelf: string;
    shelfEdge: string;
    accent: string;
    spines: string[];
    text: string;
  };
};
