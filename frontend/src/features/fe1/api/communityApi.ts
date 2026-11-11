/**
 * FE1 커뮤니티(한줄평·평점·좋아요·신고) API 계층.
 *
 * - 백엔드 계약은 be/feat/sentence-review 브랜치 docs/review-api-for-frontend.md 기준으로 확정되어 있어
 *   HTTP 구현(httpCommunityApi)은 실제 Endpoint로 작성한다.
 * - 해당 브랜치가 main에 병합되기 전까지 개발 중(__DEV__)에는 FE1_USE_DEV_MOCK 플래그로 Mock을 사용한다.
 *
 * 화면/Hook은 반드시 이 파일의 communityApi만 사용한다.
 */
import apiClient from '@/api/apiClient';
import { devMockCommunityApi } from '@/features/fe1/api/devMockCommunityApi';
import { FE1_USE_DEV_MOCK } from '@/features/fe1/constants/config';
import type {
  LikeResult,
  MyReview,
  PageResponse,
  PublicReview,
  RatingSummary,
  ReviewId,
  ReviewReportRequest,
  ReviewSort,
  ReviewWriteRequest,
} from '@/features/fe1/types/community';
import type { BookId } from '@/features/fe1/types/reading';

export type ReviewListQuery = {
  isbn: string;
  sort: ReviewSort;
  /** 0부터 */
  page: number;
  size?: number;
};

export interface CommunityApi {
  /** 책(ISBN)의 별점 통계 */
  getRatingSummary(isbn: string): Promise<RatingSummary>;
  /** 책(ISBN)의 공개 한줄평 목록 */
  getReviews(query: ReviewListQuery): Promise<PageResponse<PublicReview>>;
  /** 내 서재 책에 남긴 내 리뷰. 없으면 null */
  getMyReview(bookId: BookId): Promise<MyReview | null>;
  /** 내 리뷰 작성 (완독 회차가 있어야 함) */
  createReview(bookId: BookId, request: ReviewWriteRequest): Promise<MyReview>;
  /** 내 리뷰 수정. oneLine: ""이면 한줄평만 지운다 */
  updateReview(reviewId: ReviewId, request: ReviewWriteRequest): Promise<MyReview>;
  like(reviewId: ReviewId): Promise<LikeResult>;
  unlike(reviewId: ReviewId): Promise<LikeResult>;
  report(reviewId: ReviewId, request: ReviewReportRequest): Promise<void>;
}

/** 서버가 내려주는 오류 코드 중 화면에서 분기하는 것 */
export const COMMUNITY_ERROR_CODES = {
  reviewNotFound: 'REVIEW_NOT_FOUND',
  reviewAlreadyExists: 'REVIEW_ALREADY_EXISTS',
  readingNotCompleted: 'READING_NOT_COMPLETED',
  alreadyReported: 'ALREADY_REPORTED',
  cannotLikeOwn: 'CANNOT_LIKE_OWN_REVIEW',
  cannotReportOwn: 'CANNOT_REPORT_OWN_REVIEW',
} as const;

const DEFAULT_PAGE_SIZE = 20;

function isNotFound(error: unknown): boolean {
  const response = (error as { response?: { status?: number } })?.response;
  return response?.status === 404;
}

const httpCommunityApi: CommunityApi = {
  async getRatingSummary(isbn) {
    const { data } = await apiClient.get<RatingSummary>('/api/reviews/rating-summary', { params: { isbn } });
    return data;
  },
  async getReviews({ isbn, sort, page, size = DEFAULT_PAGE_SIZE }) {
    const { data } = await apiClient.get<PageResponse<PublicReview>>('/api/reviews', { params: { isbn, sort, page, size } });
    return data;
  },
  async getMyReview(bookId) {
    try {
      const { data } = await apiClient.get<MyReview>(`/api/books/${bookId}/review`);
      return data;
    } catch (e) {
      // 리뷰가 없으면 404 REVIEW_NOT_FOUND → 작성 전 상태
      if (isNotFound(e)) return null;
      throw e;
    }
  },
  async createReview(bookId, request) {
    const { data } = await apiClient.post<MyReview>(`/api/books/${bookId}/review`, request);
    return data;
  },
  async updateReview(reviewId, request) {
    const { data } = await apiClient.patch<MyReview>(`/api/reviews/${reviewId}`, request);
    return data;
  },
  async like(reviewId) {
    const { data } = await apiClient.put<LikeResult>(`/api/reviews/${reviewId}/like`);
    return data;
  },
  async unlike(reviewId) {
    const { data } = await apiClient.delete<LikeResult>(`/api/reviews/${reviewId}/like`);
    return data;
  },
  async report(reviewId, request) {
    await apiClient.post(`/api/reviews/${reviewId}/reports`, request);
  },
};

export const communityApi: CommunityApi = FE1_USE_DEV_MOCK ? devMockCommunityApi : httpCommunityApi;
