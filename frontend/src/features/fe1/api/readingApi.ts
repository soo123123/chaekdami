/**
 * FE1 독서 도메인 API 계층.
 * 화면은 이 파일의 타입을 그대로 쓰고, 여기서 백엔드 필드(id, coverUrl, IN_PROGRESS)로 바꿔 호출한다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '@/api/apiClient';
import { devMockReadingApi } from '@/features/fe1/api/devMockReadingApi';
import { FE1_USE_DEV_MOCK } from '@/features/fe1/constants/config';
import type {
  BookCatalogDetail,
  BookDetail,
  BookId,
  BookSearchQuery,
  BookSearchResult,
  BookStatus,
  ItemId,
  ReadingRecordRequest,
  ReadingRecordResult,
  ReadingTimeSummary,
  RegisteredBook,
  RegisterCatalogBookRequest,
  RegisterManualBookRequest,
  SearchCategory,
  SearchSort,
  Sentence,
} from '@/features/fe1/types/reading';

const THEME_KEY = '@chaekdami_library_theme';

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
  /**
   * 독서 기록 저장.
   * 응답의 readingRecordId는 회차 ID(백엔드 reading_records.id), round는 회독 수, isCompleted는 이번 저장 후 완독 여부.
   * BE1 명세 예정: POST /api/reading-records/{readingRecordId}/sessions (회차 ID를 먼저 알아야 하므로 확정 시 요청 형식이 바뀔 수 있음)
   */
  saveReadingRecord(request: ReadingRecordRequest): Promise<ReadingRecordResult>;
  /** 오늘/이번 책/이번 주 독서 시간 (FE2 통계 담당 — 제공 방식 미확정) */
  getReadingTimeSummary(bookId: BookId): Promise<ReadingTimeSummary | null>;
  /** 현재 적용된 서재 테마 */
  getLibraryTheme(): Promise<string | null>;
  /** 서재 테마 저장 */
  saveLibraryTheme(themeId: string): Promise<void>;
}

type BeStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

type BeCurrentReading = {
  recordId: number;
  round: number;
  status: BeStatus;
  currentPage: number;
} | null;

type BeBook = {
  id: number;
  itemId: number | null;
  title: string;
  author: string | null;
  isbn: string | null;
  publisher: string | null;
  publishedDate: string | null;
  coverUrl: string | null;
  description: string | null;
  totalPages: number;
  currentReading: BeCurrentReading;
};

type BeRecord = {
  id: number;
  bookId: number;
  round: number;
  status: BeStatus;
  currentPage: number;
  goalDate: string | null;
  goalPage: number | null;
  isPublic: boolean;
  startedAt: string | null;
  completedAt: string | null;
};

type BeSession = {
  readingRecordId: number;
  readingTime: number;
  startedAt: string | null;
  status: BeStatus;
};

type BeSentence = {
  sentenceId: number;
  pageNumber: number | null;
  content: string;
  createdAt: string;
};

type BeSearchItem = {
  itemId: number;
  isbn: string | null;
  title: string;
  author: string | null;
  publisher: string | null;
  publishedDate: string | null;
  coverUrl: string | null;
};

const SEARCH_CATEGORY: Record<SearchCategory, string> = {
  all: 'ALL',
  domestic: 'BOOK',
  foreign: 'FOREIGN',
  ebook: 'EBOOK',
};

// YES24 sort: DEFAULT, RELATION, RECENT, REG_DTS. 평점 정렬은 없다.
const SEARCH_SORT: Record<SearchSort, string> = {
  accuracy: 'RELATION',
  latest: 'RECENT',
  rating: 'RELATION',
};

function toStatus(status: BeStatus | undefined, currentPage: number): BookStatus {
  if (status === 'COMPLETED') return 'COMPLETED';
  if (status === 'IN_PROGRESS' || currentPage > 0) return 'READING';
  return 'NOT_STARTED';
}

function dateKey(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : '';
}

function localDate(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function toRegisteredBook(book: BeBook, record?: BeRecord | null): RegisteredBook {
  const current = record ?? null;
  const reading = book.currentReading;
  const currentPage = current?.currentPage ?? reading?.currentPage ?? 0;
  const status = toStatus(current?.status ?? reading?.status, currentPage);
  return {
    bookId: book.id,
    source: book.itemId == null ? 'MANUAL' : 'CATALOG',
    itemId: book.itemId == null ? undefined : String(book.itemId),
    title: book.title,
    author: book.author ?? '',
    publisher: book.publisher ?? undefined,
    publishedDate: book.publishedDate ?? undefined,
    isbn: book.isbn ?? undefined,
    coverImageUrl: book.coverUrl ?? undefined,
    totalPages: book.totalPages,
    currentPage,
    status,
    isPublic: current?.isPublic ?? false,
    goalDate: current?.goalDate ?? undefined,
    goalPage: current?.goalPage ?? undefined,
    startedAt: current?.startedAt ?? undefined,
    createdAt: current?.startedAt ?? current?.completedAt ?? '',
  };
}

async function getBook(bookId: BookId): Promise<BeBook> {
  const { data } = await apiClient.get<BeBook>(`/api/books/${bookId}`);
  return data;
}

async function getRecords(bookId: BookId): Promise<BeRecord[]> {
  const { data } = await apiClient.get<BeRecord[]>(`/api/books/${bookId}/reading-records`);
  return data;
}

async function getSessions(recordId: number): Promise<BeSession[]> {
  const { data } = await apiClient.get<BeSession[]>(`/api/reading-records/${recordId}/sessions`);
  return data;
}

async function sessionsOfBook(bookId: BookId): Promise<BeSession[]> {
  const records = await getRecords(bookId);
  const groups = await Promise.all(records.map(record => getSessions(record.id)));
  return groups.flat();
}

function summarize(sessions: BeSession[]): { detail: BookDetail['readingSummary']; time: ReadingTimeSummary } {
  const today = localDate();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekFrom = localDate(weekStart);
  let total = 0;
  let todaySeconds = 0;
  let weekSeconds = 0;
  const days = new Set<string>();
  for (const session of sessions) {
    const seconds = session.readingTime ?? 0;
    const day = dateKey(session.startedAt);
    total += seconds;
    if (day) days.add(day);
    if (day === today) todaySeconds += seconds;
    if (day && day >= weekFrom && day <= today) weekSeconds += seconds;
  }
  return {
    detail: total > 0
      ? { totalReadingSeconds: total, readingDays: days.size, averageSecondsPerDay: days.size ? Math.round(total / days.size) : 0 }
      : null,
    time: { todaySeconds, bookSeconds: total, weekSeconds },
  };
}

async function registerBook(body: Record<string, unknown>, settings: { currentPage: number; goalDate?: string; goalPage?: number; isPublic: boolean }): Promise<RegisteredBook> {
  const { data } = await apiClient.post<BeBook>('/api/books', body);
  const recordId = data.currentReading?.recordId;
  let record: BeRecord | null = null;
  if (recordId != null) {
    const patch: Record<string, unknown> = { isPublic: settings.isPublic };
    if (settings.currentPage > 0) patch.currentPage = settings.currentPage;
    if (settings.goalDate) patch.goalDate = settings.goalDate;
    if (settings.goalPage != null) patch.goalPage = settings.goalPage;
    const updated = await apiClient.patch<BeRecord>(`/api/reading-records/${recordId}`, patch);
    record = updated.data;
  }
  return toRegisteredBook(data, record);
}

const httpReadingApi: ReadingApi = {
  async searchBooks(query) {
    const { data } = await apiClient.get<{ items: BeSearchItem[]; totalCount: number }>('/api/books/search', {
      params: {
        query: query.keyword,
        category: SEARCH_CATEGORY[query.category],
        sort: SEARCH_SORT[query.sort],
        page: 1,
        pageSize: 20,
      },
    });
    return {
      totalCount: data.totalCount,
      items: data.items.map(item => ({
        itemId: String(item.itemId),
        title: item.title,
        author: item.author ?? '',
        coverImageUrl: item.coverUrl ?? undefined,
        publisher: item.publisher ?? undefined,
        publishedDate: item.publishedDate ?? undefined,
        isbn: item.isbn ?? undefined,
      })),
    };
  },

  async getCatalogBook(itemId) {
    const { data } = await apiClient.get<{
      itemId: number;
      title: string;
      author: string | null;
      isbn: string | null;
      publisher: string | null;
      publishedDate: string | null;
      coverUrl: string | null;
      description: string | null;
      totalPages: number | null;
    }>(`/api/books/search/${itemId}`);
    const detail: BookCatalogDetail = {
      itemId: String(data.itemId),
      title: data.title,
      author: data.author ?? '',
      coverImageUrl: data.coverUrl ?? undefined,
      publisher: data.publisher ?? undefined,
      publishedDate: data.publishedDate ?? undefined,
      isbn: data.isbn ?? undefined,
      totalPages: data.totalPages ?? undefined,
      description: data.description ?? undefined,
    };
    return detail;
  },

  async registerCatalogBook(request) {
    const catalog = await httpReadingApi.getCatalogBook(request.itemId);
    return registerBook({
      itemId: Number(request.itemId),
      title: catalog.title,
      author: catalog.author,
      isbn: catalog.isbn,
      publisher: catalog.publisher,
      publishedDate: catalog.publishedDate,
      coverUrl: catalog.coverImageUrl,
      description: catalog.description,
      totalPages: request.totalPages ?? catalog.totalPages,
    }, request);
  },

  async registerManualBook(request) {
    return registerBook({
      title: request.book.title,
      author: request.book.author,
      isbn: request.book.isbn,
      publisher: request.book.publisher,
      publishedDate: request.book.publishedDate,
      totalPages: request.totalPages,
    }, request);
  },

  async getLibraryBooks() {
    const { data } = await apiClient.get<BeBook[]>('/api/books');
    return data.map(book => toRegisteredBook(book));
  },

  async getBookDetail(bookId) {
    const book = await getBook(bookId);
    const records = await getRecords(bookId);
    const latest = records[0] ?? null;
    const recordId = latest?.id ?? book.currentReading?.recordId;
    const [sentences, sessionGroups] = await Promise.all([
      recordId == null
        ? Promise.resolve([] as Sentence[])
        : apiClient.get<BeSentence[]>(`/api/reading-records/${recordId}/sentences`).then(({ data }) => data.map(sentence => ({
            sentenceId: sentence.sentenceId,
            content: sentence.content,
            page: sentence.pageNumber ?? undefined,
            createdAt: sentence.createdAt,
          }))),
      Promise.all(records.map(record => getSessions(record.id))),
    ]);
    return {
      book: toRegisteredBook(book, latest),
      readingSummary: summarize(sessionGroups.flat()).detail,
      sentences,
    };
  },

  async removeBook(bookId) {
    await apiClient.delete(`/api/books/${bookId}`);
  },

  async saveReadingRecord(request) {
    const book = await getBook(request.bookId);
    let recordId = book.currentReading?.recordId;
    let round = book.currentReading?.round ?? 1;
    if (book.currentReading?.status === 'COMPLETED' || recordId == null) {
      const created = await apiClient.post<BeRecord>(`/api/books/${request.bookId}/reading-records`, {});
      recordId = created.data.id;
      round = created.data.round;
    }
    const { data: session } = await apiClient.post<BeSession>('/api/reading-sessions', {
      bookId: request.bookId,
      readingTime: request.readingTime,
      startPage: request.startPage,
      endPage: request.endPage,
    });
    const sentence = request.sentence?.trim();
    if (sentence && recordId != null) {
      await apiClient.post(`/api/reading-records/${recordId}/sentences`, {
        content: sentence,
        ...(request.endPage > 0 ? { pageNumber: request.endPage } : {}),
      });
    }
    const saved: ReadingRecordResult = {
      readingRecordId: session.readingRecordId ?? recordId!,
      round,
      isCompleted: session.status === 'COMPLETED',
    };
    return saved;
  },

  async getReadingTimeSummary(bookId) {
    const sessions = await sessionsOfBook(bookId);
    return summarize(sessions).time;
  },

  async getLibraryTheme() {
    return AsyncStorage.getItem(THEME_KEY);
  },

  async saveLibraryTheme(themeId) {
    await AsyncStorage.setItem(THEME_KEY, themeId);
  },
};

export const readingApi: ReadingApi = FE1_USE_DEV_MOCK ? devMockReadingApi : httpReadingApi;
