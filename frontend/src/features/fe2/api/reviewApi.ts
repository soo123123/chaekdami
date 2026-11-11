import apiClient from '@/api/apiClient';

// ========================================
// 문장 저장 관련 기능
// 현재 FE1 담당
// 기존 코드이므로 임의로 수정하지 않음
// ========================================

export const getSentences = async (
  readingRecordId: number
) => {
  const response = await apiClient.get(
    `/reading-records/${readingRecordId}/sentences`
  );

  return response.data;
};


export const createSentence = async (
  readingRecordId: number,
  content: string,
  pageNumber: number
) => {
  const response = await apiClient.post(
    `/reading-records/${readingRecordId}/sentences`,
    {
      content,
      pageNumber,
    }
  );

  return response.data;
};


export const deleteSentence = async (
  sentenceId: number
) => {
  await apiClient.delete(
    `/sentences/${sentenceId}`
  );
};


// ========================================
// 독후감 관련 기능 (FE2)
// 백엔드 명세: docs/review-api-for-frontend.md (be/feat/sentence-review 브랜치) 3장
// - 독후감은 회차(readingRecordId)당 1개, 완독한 회차에서만 저장된다.
// - 별점·한줄평(책당 리뷰)은 FE1 커뮤니티 화면에서 다루므로 여기서는 보내지 않는다.
// ========================================

/** 독후감 (회차당 1개) */
export type BookReport = {
  bookReportId: number;
  readingRecordId: number;
  bookId: number;
  content: string;
  isPublic: boolean;
  /** 내용이 바뀔 때마다 1씩 오른다 */
  revision: number;
  createdAt: string;
  updatedAt: string;
};

/** GET/PUT /reading-records/{readingRecordId}/review 응답 */
export type ReadingReviewResponse = {
  readingRecordId: number;
  /** 몇 회독인지 */
  round: number;
  bookId: number;
  /** 이 회차가 완독 상태인지 (완독이어야 독후감 저장 가능) */
  canWrite: boolean;
  /** 책당 리뷰(별점·한줄평). 독후감 화면에서는 쓰지 않는다 */
  review: unknown | null;
  /** 아직 쓰지 않았으면 null */
  bookReport: BookReport | null;
};

export type BookReportInput = {
  /** 1~2000자 */
  content: string;
  /** 기본 비공개 */
  isPublic: boolean;
};

export const BOOK_REPORT_MAX_LENGTH = 2000;

/**
 * 개발용 Mock 사용 여부. 백엔드 연결 후 false로 바꾼다.
 * 프로덕션 빌드(__DEV__ === false)에서는 항상 실제 API를 쓴다.
 */
const REVIEW_USE_DEV_MOCK = __DEV__ && true;

/** 회차의 독후감 상태 조회 (없으면 bookReport가 null, 404 아님) */
export const getReadingReview = async (
  readingRecordId: number
): Promise<ReadingReviewResponse> => {
  if (REVIEW_USE_DEV_MOCK) return devMockReview.get(readingRecordId);

  const response = await apiClient.get<ReadingReviewResponse>(
    `/reading-records/${readingRecordId}/review`
  );

  return response.data;
};

/** 독후감 작성·수정 (같은 회차 다시 저장도 이 PUT). 완독 전이면 409 READING_NOT_COMPLETED */
export const saveBookReport = async (
  readingRecordId: number,
  input: BookReportInput
): Promise<ReadingReviewResponse> => {
  if (REVIEW_USE_DEV_MOCK) return devMockReview.put(readingRecordId, input);

  const response = await apiClient.put<ReadingReviewResponse>(
    `/reading-records/${readingRecordId}/review`,
    { bookReport: input }
  );

  return response.data;
};

// ----------------------------------------
// ⚠️ 개발 전용 Mock — 앱 실행 중 메모리에만 저장된다.
// 회차 완독 여부를 알 수 없어 canWrite는 항상 true다
// (독서 완료 화면은 FE1이 넘긴 완독 여부를 함께 확인한다).
// ----------------------------------------

const mockReports = new Map<number, BookReport>();
let mockNextReportId = 1;

const devMockReview = {
  async get(readingRecordId: number): Promise<ReadingReviewResponse> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      readingRecordId,
      round: 1,
      bookId: 0,
      canWrite: true,
      review: null,
      bookReport: mockReports.get(readingRecordId) ?? null,
    };
  },

  async put(readingRecordId: number, input: BookReportInput): Promise<ReadingReviewResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const now = new Date().toISOString();
    const existing = mockReports.get(readingRecordId);
    if (!input.content) {
      mockReports.delete(readingRecordId);
    } else if (existing) {
      mockReports.set(readingRecordId, {
        ...existing,
        content: input.content,
        isPublic: input.isPublic,
        revision: existing.content === input.content ? existing.revision : existing.revision + 1,
        updatedAt: now,
      });
    } else {
      mockReports.set(readingRecordId, {
        bookReportId: mockNextReportId++,
        readingRecordId,
        bookId: 0,
        content: input.content,
        isPublic: input.isPublic,
        revision: 1,
        createdAt: now,
        updatedAt: now,
      });
    }
    return devMockReview.get(readingRecordId);
  },
};
