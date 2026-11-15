/**
 * ⚠️ 개발 전용 Mock API — 실제 서버 데이터가 아니다.
 *
 * - 커뮤니티 화면(별점 통계, 한줄평 목록, 내 리뷰 작성/수정, 좋아요, 신고)을 백엔드 없이 확인하기 위한 용도다.
 * - 응답 형식은 be/feat/sentence-review의 docs/review-api-for-frontend.md를 그대로 따른다.
 * - 데이터는 앱 실행 중 메모리에만 유지된다.
 */
import { devMockReadingApi } from './devMockReadingApi';
import type { CommunityApi } from './communityApi';
import type { LikeResult, MyReview, PublicReview, RatingKey, ReviewWriteRequest } from '../types/community';

const LATENCY_MS = 350;
const wait = (ms = LATENCY_MS) => new Promise(resolve => setTimeout(resolve, ms));

class MockHttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

const ME = { userId: 1, nickname: '나' };
const ONE_LINE_MAX = 100;

/** 서버 형식과 같은 한국 시간(시간대 표기 없음) 문자열 */
function kstNow(offsetMs = 0): string {
  const date = new Date(Date.now() + 9 * 3600000 - offsetMs);
  return date.toISOString().replace('Z', '');
}

type StoredReview = PublicReview & { isbn: string; bookId?: number; isPublic: boolean; likedBy: Set<number> };

let nextReviewId = 1;
const reviews: StoredReview[] = [];

const H = 3600000;
const D = 24 * H;
const SEED: { isbn: string; rows: [nickname: string, rating: number, oneLine: string, ago: number, likes: number, spoiler?: boolean][] }[] = [
  {
    isbn: '9791162540640',
    rows: [
      ['user_12', 5, '작은 변화가 인생을 바꾼다는 말이 와닿았어요.', 2 * H, 12],
      ['booklover', 4, '습관을 만드는 구체적인 방법이 정말 도움이 됐어요!', 5 * H, 8],
      ['reading bear', 4, '읽기 쉽고 실천하기 좋아서 추천하고 싶은 책이에요.', 1 * D, 5],
      ['새벽독서', 5, '마지막 장의 정체성 이야기가 가장 오래 남네요.', 3 * D, 3, true],
      ['하루한장', 3, '좋은 내용이지만 조금 반복되는 느낌도 있었어요.', 6 * D, 1],
    ],
  },
  {
    isbn: '9788937460449',
    rows: [
      ['새는알을깨고', 5, '스무 살에 읽었을 때와 지금 읽었을 때가 완전히 다른 책이에요.', 3 * H, 21],
      ['booklover', 4, '문장 하나하나를 천천히 곱씹게 되는 책.', 9 * H, 7],
      ['밤의서재', 5, '데미안의 정체가 밝혀지는 순간 소름이 돋았어요.', 2 * D, 4, true],
      ['reading bear', 3, '어렵지만 다시 읽어보고 싶어요.', 8 * D, 0],
    ],
  },
  {
    isbn: '9791161571188',
    rows: [
      ['편의점단골', 5, '읽는 내내 마음이 따뜻해지는 책이었어요.', 1 * H, 15],
      ['booklover', 4, '독고 씨의 변화가 뭉클했어요.', 7 * H, 9],
      ['밤의서재', 4, '독고의 과거가 밝혀지는 장면에서 울컥했어요.', 1 * D, 2, true],
    ],
  },
  {
    isbn: '9788937462672',
    rows: [
      ['user_12', 4, '꿈을 좇는다는 것의 무게를 생각하게 돼요.', 4 * H, 6],
    ],
  },
];

let fakeUserId = 100;
const userIds = new Map<string, number>();
for (const { isbn, rows } of SEED) {
  for (const [nickname, rating, oneLine, ago, likes, spoiler] of rows) {
    if (!userIds.has(nickname)) userIds.set(nickname, fakeUserId++);
    const time = kstNow(ago);
    reviews.push({
      reviewId: nextReviewId++, isbn, rating, oneLine, isSpoiler: !!spoiler, likeCount: likes, isLiked: false, isMine: false,
      author: { userId: userIds.get(nickname)!, nickname }, createdAt: time, updatedAt: time, isPublic: true, likedBy: new Set(),
    });
  }
}
// 블라인드되지 않았지만 별점만 있는 리뷰(목록에는 안 나오고 통계에만 포함)
reviews.push({
  reviewId: nextReviewId++, isbn: '9791162540640', rating: 5, oneLine: '', isSpoiler: false, likeCount: 0, isLiked: false,
  isMine: false, author: { userId: 999, nickname: 'quiet' }, createdAt: kstNow(10 * D), updatedAt: kstNow(10 * D), isPublic: false, likedBy: new Set(),
});

const reportedBy = new Set<string>();

function normalizeIsbn(isbn: string) {
  return isbn.replace(/[-\s]/g, '');
}

function findReview(reviewId: number): StoredReview {
  const review = reviews.find(r => r.reviewId === reviewId);
  if (!review) throw new MockHttpError(404, 'REVIEW_NOT_FOUND', '리뷰를 찾을 수 없어요.');
  return review;
}

function toPublic(review: StoredReview): PublicReview {
  const { isbn: _i, bookId: _b, isPublic: _p, likedBy, ...rest } = review;
  return { ...rest, isLiked: likedBy.has(ME.userId), isMine: review.author.userId === ME.userId };
}

function toMine(review: StoredReview): MyReview {
  return {
    reviewId: review.reviewId, bookId: review.bookId!, rating: review.rating, oneLine: review.oneLine || null,
    isSpoiler: review.isSpoiler, isPublic: review.isPublic, isBlinded: false, likeCount: review.likeCount,
    createdAt: review.createdAt, updatedAt: review.updatedAt,
  };
}

function validate(request: ReviewWriteRequest, isCreate: boolean) {
  if (isCreate && request.rating === undefined) throw new MockHttpError(400, 'VALIDATION_ERROR', '별점을 선택해주세요.');
  if (request.rating !== undefined && (!Number.isInteger(request.rating) || request.rating < 1 || request.rating > 5)) {
    throw new MockHttpError(400, 'VALIDATION_ERROR', '별점은 1~5점이어야 해요.');
  }
  if (request.oneLine !== undefined && (request.oneLine.length > ONE_LINE_MAX || /[\r\n]/.test(request.oneLine))) {
    throw new MockHttpError(400, 'VALIDATION_ERROR', '한줄평은 줄바꿈 없이 100자 이내로 입력해주세요.');
  }
}

function setLike(reviewId: number, liked: boolean): LikeResult {
  const review = findReview(reviewId);
  if (review.author.userId === ME.userId) throw new MockHttpError(400, 'CANNOT_LIKE_OWN_REVIEW', '내 한줄평에는 좋아요를 누를 수 없어요.');
  const had = review.likedBy.has(ME.userId);
  if (liked && !had) {
    review.likedBy.add(ME.userId);
    review.likeCount += 1;
  } else if (!liked && had) {
    review.likedBy.delete(ME.userId);
    review.likeCount -= 1;
  }
  return { reviewId, liked, likeCount: review.likeCount };
}

export const devMockCommunityApi: CommunityApi = {
  async getRatingSummary(isbn) {
    await wait();
    const target = normalizeIsbn(isbn);
    const list = reviews.filter(r => r.isbn === target);
    const distribution: Record<RatingKey, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    list.forEach(r => { distribution[String(r.rating) as RatingKey] += 1; });
    const sum = list.reduce((acc, r) => acc + r.rating, 0);
    return {
      isbn: target,
      averageRating: list.length ? Math.round((sum / list.length) * 10) / 10 : 0,
      ratingCount: list.length,
      distribution,
    };
  },

  async getReviews({ isbn, sort, page, size = 20 }) {
    await wait();
    const target = normalizeIsbn(isbn);
    const list = reviews
      .filter(r => r.isbn === target && r.isPublic && r.oneLine)
      .sort((a, b) => (sort === 'likes' ? b.likeCount - a.likeCount : 0) || b.createdAt.localeCompare(a.createdAt));
    const items = list.slice(page * size, page * size + size).map(toPublic);
    return { items, page, size, totalElements: list.length, hasNext: (page + 1) * size < list.length };
  },

  async getMyReview(bookId) {
    await wait();
    const mine = reviews.find(r => r.bookId === bookId && r.author.userId === ME.userId);
    return mine ? toMine(mine) : null;
  },

  async createReview(bookId, request) {
    await wait();
    const { book } = await devMockReadingApi.getBookDetail(bookId);
    if (book.status !== 'COMPLETED') throw new MockHttpError(409, 'READING_NOT_COMPLETED', '완독한 책에만 한줄평을 남길 수 있어요.');
    if (reviews.some(r => r.bookId === bookId && r.author.userId === ME.userId)) {
      throw new MockHttpError(409, 'REVIEW_ALREADY_EXISTS', '이미 이 책에 한줄평을 남겼어요.');
    }
    validate(request, true);
    const now = kstNow();
    const review: StoredReview = {
      reviewId: nextReviewId++, isbn: normalizeIsbn(book.isbn ?? ''), bookId, rating: request.rating!,
      oneLine: request.oneLine ?? '', isSpoiler: request.isSpoiler ?? false, isPublic: request.isPublic ?? true,
      likeCount: 0, isLiked: false, isMine: true, author: ME, createdAt: now, updatedAt: now, likedBy: new Set(),
    };
    reviews.push(review);
    return toMine(review);
  },

  async updateReview(reviewId, request) {
    await wait();
    const review = findReview(reviewId);
    if (review.author.userId !== ME.userId) throw new MockHttpError(404, 'REVIEW_NOT_FOUND', '리뷰를 찾을 수 없어요.');
    validate(request, false);
    if (request.rating !== undefined) review.rating = request.rating;
    if (request.oneLine !== undefined) review.oneLine = request.oneLine;
    if (request.isSpoiler !== undefined) review.isSpoiler = request.isSpoiler;
    if (request.isPublic !== undefined) review.isPublic = request.isPublic;
    review.updatedAt = kstNow();
    return toMine(review);
  },

  async like(reviewId) {
    await wait(150);
    return setLike(reviewId, true);
  },

  async unlike(reviewId) {
    await wait(150);
    return setLike(reviewId, false);
  },

  async report(reviewId, { reason, detail }) {
    await wait();
    const review = findReview(reviewId);
    if (review.author.userId === ME.userId) throw new MockHttpError(400, 'CANNOT_REPORT_OWN_REVIEW', '내 한줄평은 신고할 수 없어요.');
    if (reason === 'OTHER' && !detail?.trim()) throw new MockHttpError(400, 'VALIDATION_ERROR', '기타 사유를 입력해주세요.');
    const key = `${ME.userId}:${reviewId}`;
    if (reportedBy.has(key)) throw new MockHttpError(409, 'ALREADY_REPORTED', '이미 신고한 한줄평이에요.');
    reportedBy.add(key);
  },
};
