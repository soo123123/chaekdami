/**
 * FE1 독서 도메인 API 계층.
 * 화면은 이 파일의 타입을 그대로 쓰고, 여기서 백엔드 필드(id, coverUrl, IN_PROGRESS)로 바꿔 호출한다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '@/api/apiClient';
import { MAX_SEARCH_PAGES, SEARCH_PAGE_SIZE } from '@/features/fe1/constants/options';
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
  ReadingRound,
  ReadingSettingsUpdate,
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
  /** 회차의 공개·목표 설정 수정 (TODO-32) */
  updateReadingSettings(readingRecordId: number, settings: ReadingSettingsUpdate): Promise<void>;
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
  /** 세션 번호 (저장 응답에만 있음) */
  id?: number;
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

function toReadingRound(record: BeRecord): ReadingRound {
  return {
    readingRecordId: record.id,
    round: record.round,
    status: toStatus(record.status, record.currentPage),
    completedAt: record.completedAt ?? undefined,
  };
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

function summarize(sessions: BeSession[]): { detail: BookDetail['readingSummary']; bookSeconds: number } {
  let total = 0;
  const days = new Set<string>();
  for (const session of sessions) {
    const seconds = session.readingTime ?? 0;
    const day = dateKey(session.startedAt);
    total += seconds;
    if (day) days.add(day);
  }
  return {
    detail: total > 0
      ? { totalReadingSeconds: total, readingDays: days.size, averageSecondsPerDay: days.size ? Math.round(total / days.size) : 0 }
      : null,
    bookSeconds: total,
  };
}

/** 실패하면 undefined. 시간 요약은 값 하나가 실패해도 나머지를 보여준다. */
const orUndefined = <T,>(promise: Promise<T>): Promise<T | undefined> => promise.catch(() => undefined);

async function registerBook(body: Record<string, unknown>, settings: { currentPage: number; goalDate?: string; goalPage?: number; isPublic: boolean }): Promise<RegisteredBook> {
  const { data } = await apiClient.post<BeBook>('/api/books', body);
  const recordId = data.currentReading?.recordId;
  if (recordId == null) return { ...toRegisteredBook(data, null), settingsSaveFailed: true };
  // 등록과 설정 저장은 요청 2번이다. 책은 이미 서재에 들어갔으므로, 설정 저장이 실패해도 등록 실패로 보이지 않게 한다 (ISSUE-BUG-20).
  const patch: Record<string, unknown> = { isPublic: settings.isPublic };
  if (settings.currentPage > 0) patch.currentPage = settings.currentPage;
  if (settings.goalDate) patch.goalDate = settings.goalDate;
  if (settings.goalPage != null) patch.goalPage = settings.goalPage;
  try {
    const updated = await apiClient.patch<BeRecord>(`/api/reading-records/${recordId}`, patch);
    return toRegisteredBook(data, updated.data);
  } catch {
    return { ...toRegisteredBook(data, null), settingsSaveFailed: true };
  }
}

const httpReadingApi: ReadingApi = {
  async searchBooks(query) {
    const page = query.page ?? 1;
    const { data } = await apiClient.get<{ items: BeSearchItem[]; totalCount: number }>('/api/books/search', {
      params: {
        query: query.keyword,
        category: SEARCH_CATEGORY[query.category],
        sort: SEARCH_SORT[query.sort],
        page,
        pageSize: SEARCH_PAGE_SIZE,
      },
    });
    return {
      totalCount: data.totalCount,
      // totalCount가 실제보다 클 수 있어, 빈 페이지가 오면 끝으로 본다 (TODO-33)
      hasNext: data.items.length > 0 && page * SEARCH_PAGE_SIZE < data.totalCount && page < MAX_SEARCH_PAGES,
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
      rounds: [...records].sort((a, b) => b.round - a.round).map(toReadingRound),
      currentRound: latest ? toReadingRound(latest) : null,
    };
  },

  async removeBook(bookId) {
    await apiClient.delete(`/api/books/${bookId}`);
  },

  async updateReadingSettings(readingRecordId, settings) {
    await apiClient.patch(`/api/reading-records/${readingRecordId}`, {
      isPublic: settings.isPublic,
      ...(settings.goalDate ? { goalDate: settings.goalDate } : {}),
      ...(settings.goalPage != null ? { goalPage: settings.goalPage } : {}),
    });
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
    // 세션·문장·사진 인증 연결을 요청 한 번으로 저장한다. 서버가 한 트랜잭션으로 처리하므로
    // 실패하면 아무것도 저장되지 않고, '다시 시도하기'로 같은 요청을 보내도 세션이 2건이 되지 않는다.
    // 문장 쪽 번호는 서버가 endPage로 정한다. (문장 API를 따로 부르지 않는다)
    const sentence = request.sentence?.trim();
    const { data: session } = await apiClient.post<BeSession>('/api/reading-sessions', {
      bookId: request.bookId,
      readingTime: request.readingTime,
      startPage: request.startPage,
      endPage: request.endPage,
      ...(sentence ? { sentence } : {}),
      // 사진 인증을 통과했을 때만 보낸다. 서버는 이 번호의 인증을 이 세션에 연결해 사진 인증 보상을 판단한다.
      ...(request.photoVerificationId != null ? { photoVerificationId: request.photoVerificationId } : {}),
    });
    const saved: ReadingRecordResult = {
      readingRecordId: session.readingRecordId ?? recordId!,
      round,
      isCompleted: session.status === 'COMPLETED',
      sessionId: session.id ?? null,
    };
    return saved;
  },

  async getReadingTimeSummary(bookId) {
    // 오늘·이번 주는 모든 책의 기록을 서버가 한국 날짜 기준으로 모은 값을 쓴다 (ISSUE-BUG-19).
    // 서버 값은 분 단위라 초로 바꿔 둔다. 이번 책 시간만 이 책의 세션 합(초)이다.
    const [today, stats, bookSeconds] = await Promise.all([
      orUndefined(apiClient.get<{ readingMinutes: number }>('/api/me/reading-today').then(({ data }) => data.readingMinutes * 60)),
      orUndefined(apiClient.get<{ weekly: { minutes: number }[] }>('/api/me/reading-stats')
        .then(({ data }) => data.weekly.reduce((sum, day) => sum + day.minutes, 0) * 60)),
      orUndefined(sessionsOfBook(bookId).then(sessions => summarize(sessions).bookSeconds)),
    ]);
    return { todaySeconds: today, weekSeconds: stats, bookSeconds };
  },

  async getLibraryTheme() {
    return AsyncStorage.getItem(THEME_KEY);
  },

  async saveLibraryTheme(themeId) {
    await AsyncStorage.setItem(THEME_KEY, themeId);
  },
};

export const readingApi: ReadingApi = FE1_USE_DEV_MOCK ? devMockReadingApi : httpReadingApi;
