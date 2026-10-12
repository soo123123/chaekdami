/**
 * FE1 독서 도메인 API 계층.
 *
 * 현재 상태
 * - 백엔드(main, be/feat/auth-user 브랜치)에 도서/독서 기록 API가 아직 없다.
 * - 따라서 HTTP 구현(httpReadingApi)은 Endpoint·필드명을 임의로 정하지 않고
 *   ContractPendingError를 던진다. 계약 확정 시 각 함수 본문만 채우면 된다.
 * - 개발 중(__DEV__)에는 FE1_USE_DEV_MOCK 플래그로 개발용 Mock을 사용한다.
 *   Mock 데이터는 features/fe1/api/devMockReadingApi.ts에만 존재하며 실제 API 데이터와 섞이지 않는다.
 *
 * 화면/Hook은 반드시 이 파일의 readingApi만 사용한다.
 */
import { devMockReadingApi } from '@/features/fe1/api/devMockReadingApi';
import { FE1_USE_DEV_MOCK } from '@/features/fe1/constants/config';
import type {
  BookCatalogDetail,
  BookDetail,
  BookId,
  BookSearchQuery,
  BookSearchResult,
  ItemId,
  ReadingRecordRequest,
  ReadingRecordResult,
  ReadingTimeSummary,
  RegisteredBook,
  RegisterCatalogBookRequest,
  RegisterManualBookRequest,
} from '@/features/fe1/types/reading';
import { ContractPendingError } from '@/features/fe1/utils/apiError';

export interface ReadingApi {
  /** 외부 도서 검색 (YES24) */
  searchBooks(query: BookSearchQuery): Promise<BookSearchResult>;
  /** 외부 도서 상세 (itemId 기준) */
  getCatalogBook(itemId: ItemId): Promise<BookCatalogDetail>;
  /** 검색한 책 등록 → 내부 bookId 발급 */
  registerCatalogBook(request: RegisterCatalogBookRequest): Promise<RegisteredBook>;
  /** 직접 입력한 책 등록 → 내부 bookId 발급 */
  registerManualBook(request: RegisterManualBookRequest): Promise<RegisteredBook>;
  /** 내 서재 목록 */
  getLibraryBooks(): Promise<RegisteredBook[]>;
  /** 등록 도서 상세 (bookId 기준) */
  getBookDetail(bookId: BookId): Promise<BookDetail>;
  /** 등록 도서 삭제 */
  removeBook(bookId: BookId): Promise<void>;
  /** 독서 기록 저장 */
  saveReadingRecord(request: ReadingRecordRequest): Promise<ReadingRecordResult>;
  /** 오늘/이번 책/이번 주 독서 시간 (FE2 통계 담당 — 제공 방식 미확정) */
  getReadingTimeSummary(bookId: BookId): Promise<ReadingTimeSummary | null>;
  /** 현재 적용된 서재 테마 */
  getLibraryTheme(): Promise<string | null>;
  /** 서재 테마 저장 */
  saveLibraryTheme(themeId: string): Promise<void>;
}

/**
 * 실제 서버 연동 구현.
 * 계약 확정 후 apiClient(@/api/apiClient)를 사용해 구현한다.
 * 인증 방식(Authorization 헤더 / 임시 X-User-Id 헤더)도 확정 후 apiClient 인터셉터에서 처리한다.
 */
const httpReadingApi: ReadingApi = {
  searchBooks: async () => {
    throw new ContractPendingError('도서 검색');
  },
  getCatalogBook: async () => {
    throw new ContractPendingError('도서 정보 조회');
  },
  registerCatalogBook: async () => {
    throw new ContractPendingError('책 등록');
  },
  registerManualBook: async () => {
    throw new ContractPendingError('수동 책 등록');
  },
  getLibraryBooks: async () => {
    throw new ContractPendingError('서재 목록 조회');
  },
  getBookDetail: async () => {
    throw new ContractPendingError('책 상세 조회');
  },
  removeBook: async () => {
    throw new ContractPendingError('책 삭제');
  },
  saveReadingRecord: async () => {
    throw new ContractPendingError('독서 기록 저장');
  },
  getReadingTimeSummary: async () => null,
  getLibraryTheme: async () => {
    throw new ContractPendingError('서재 테마 조회');
  },
  saveLibraryTheme: async () => {
    throw new ContractPendingError('서재 테마 저장');
  },
};

export const readingApi: ReadingApi = FE1_USE_DEV_MOCK ? devMockReadingApi : httpReadingApi;
