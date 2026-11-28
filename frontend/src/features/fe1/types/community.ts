/**
 * FE1 커뮤니티(한줄평·평점) 타입.
 *
 * 백엔드 be/feat/sentence-review 브랜치의 docs/review-api-for-frontend.md 계약을 따른다.
 * - 리뷰는 책당 1개이며 별점(rating)과 한줄평(oneLine)을 함께 가진다.
 * - 한줄평 목록·별점 통계·좋아요·신고는 ISBN 기준 API다.
 * - 목록 페이지 번호는 0부터 시작한다.
 */
import type { BookId } from './reading';

export type ReviewId = number;

/** 백엔드 공용 페이지 응답 */
export type PageResponse<T> = {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  hasNext: boolean;
};

export type RatingKey = '1' | '2' | '3' | '4' | '5';

/** GET /api/reviews/rating-summary?isbn= — 블라인드 리뷰를 뺀 모든 별점 통계 */
export type RatingSummary = {
  isbn: string;
  /** 리뷰가 없으면 0.0 */
  averageRating: number;
  ratingCount: number;
  /** 항상 1~5 키가 모두 있다 */
  distribution: Record<RatingKey, number>;
};

/** latest(기본): 최신순, likes: 좋아요순 */
export type ReviewSort = 'latest' | 'likes';

export type ReviewAuthor = {
  userId: number;
  nickname: string;
};

/** GET /api/reviews?isbn= 목록 항목 (공개 + 블라인드 아님 + 한줄평 있음) */
export type PublicReview = {
  reviewId: ReviewId;
  rating: number;
  oneLine: string;
  isSpoiler: boolean;
  likeCount: number;
  isLiked: boolean;
  isMine: boolean;
  author: ReviewAuthor;
  createdAt: string;
  updatedAt: string;
};

/** 내 리뷰 (GET /api/books/{bookId}/review, POST, PATCH 응답) */
export type MyReview = {
  reviewId: ReviewId;
  bookId: BookId;
  rating: number;
  /** 별점만 있으면 null 또는 빈 문자열 */
  oneLine: string | null;
  isSpoiler: boolean;
  isPublic: boolean;
  isBlinded: boolean;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * 리뷰 작성/수정 요청. 보내지 않은 필드는 그대로 둔다.
 * - rating: 1~5 정수, 생성 시 필수
 * - oneLine: 최대 100자, 줄바꿈 불가. ""를 보내면 한줄평만 지워진다(별점은 남음)
 */
export type ReviewWriteRequest = {
  rating?: number;
  oneLine?: string;
  isSpoiler?: boolean;
  isPublic?: boolean;
};

export type LikeResult = {
  reviewId: ReviewId;
  liked: boolean;
  likeCount: number;
};

export type ReportReason = 'SPOILER' | 'ABUSIVE' | 'SPAM' | 'INAPPROPRIATE' | 'OTHER';

export type ReviewReportRequest = {
  reason: ReportReason;
  /** OTHER면 필수, 최대 300자 */
  detail?: string;
};

/* ------------------------------------------------------------------ */
/* 완독자 커뮤니티 (공개 문장 모음집·독후감)                               */
/* ------------------------------------------------------------------ */

/** GET /api/books/{bookId}/community — 잠겨 있어도 숫자는 준다 */
export type CommunitySummary = {
  bookId: BookId;
  isbn: string | null;
  /** false면 직접 등록한 책(ISBN 없음) */
  available: boolean;
  /** false면 아직 완독하지 않음 */
  unlocked: boolean;
  lockReason: 'NO_ISBN' | 'NOT_COMPLETED' | null;
  /** 같은 ISBN을 완독한 사람 수 */
  completerCount: number;
  publicCollectionCount: number;
  publicBookReportCount: number;
};

export type CommunitySentence = {
  sentenceId: number;
  content: string;
  pageNumber: number | null;
};

/** 커뮤니티 항목 목록의 한 항목 = 모음집이나 독후감을 공개한 완독 회차 */
export type CommunityEntry = {
  readingRecordId: number;
  round: number;
  completedAt: string;
  author: ReviewAuthor;
  isMine: boolean;
  /** 공개하지 않았거나 문장이 없으면 null. 미리보기는 최대 3개 */
  sentenceCollection: { sentenceCount: number; previewSentences: CommunitySentence[] } | null;
  /** 비공개면 null. preview는 앞 150자, length는 전체 글자 수 */
  bookReport: { bookReportId: number; preview: string; length: number } | null;
};

export type CommunityCollectionDay = {
  readDate: string;
  /** 회차 시작일을 1일차로 센 날 */
  dayNumber: number;
  sentences: (CommunitySentence & { createdAt: string; updatedAt: string })[];
};

export type CommunityEntryDetail = {
  readingRecordId: number;
  round: number;
  completedAt: string;
  author: ReviewAuthor;
  isMine: boolean;
  sentenceCollection: {
    readingPeriodDays: number;
    recordedDayCount: number;
    sentenceCount: number;
    days: CommunityCollectionDay[];
  } | null;
  bookReport: { bookReportId: number; content: string; createdAt: string; updatedAt: string } | null;
};

/** 신고할 커뮤니티 글 (독후감·문장). 요청과 사유 규칙은 한줄평 신고와 같다 */
export type ContentReportTarget =
  | { kind: 'bookReport'; bookReportId: number }
  | { kind: 'sentence'; sentenceId: number };
