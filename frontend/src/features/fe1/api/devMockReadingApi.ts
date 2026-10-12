/**
 * ⚠️ 개발 전용 Mock API — 실제 서버 데이터가 아니다.
 *
 * - 화면 흐름(검색 → 등록 → 서재 → 상세 → 독서 → 기록)을 백엔드 없이 확인하기 위한 용도다.
 * - 데이터는 앱 실행 중 메모리에만 유지되며, 새로고침하면 초기화된다.
 * - 응답 구조는 FE1 타입(types/reading.ts) 기준이며 백엔드 계약을 의미하지 않는다.
 */
import type { ReadingApi } from './readingApi';
import type {
  BookCatalogDetail,
  BookDetail,
  RegisteredBook,
  Sentence,
} from '../types/reading';
import { todayIso } from '../utils/format';

const LATENCY_MS = 450;
const wait = (ms = LATENCY_MS) => new Promise(resolve => setTimeout(resolve, ms));

class MockHttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type CatalogEntry = BookCatalogDetail & { region: 'domestic' | 'foreign'; isEbook: boolean };

const DEV_CATALOG: CatalogEntry[] = [
  {
    itemId: 'dev-1001', title: '아주 작은 습관의 힘', author: '제임스 클리어', publisher: '비즈니스북스',
    publishedDate: '2019-01-10', isbn: '9791162540640', totalPages: 400, rating: 4.8, reviewCount: 12345,
    categories: ['자기계발', '습관', '성장'], format: '종이책', highlight: '작은 변화가 만드는\n놀라운 인생의 차이.',
    description: '아주 작은 습관들이 모여 인생을 바꾼다! 세계적인 습관 전문가 제임스 클리어가 전하는 지속 가능한 변화의 법칙. 작은 행동의 힘이 만들어내는 놀라운 결과를 다양한 사례와 함께 소개한다. 좋은 습관을 만들고 나쁜 습관을 끊는 네 가지 법칙을 실천 가능한 방법으로 정리했다.',
    region: 'foreign', isEbook: false,
  },
  {
    itemId: 'dev-1002', title: '달과 6펜스', author: '서머싯 몸', publisher: '민음사', publishedDate: '2011-05-20',
    isbn: '9788937462672', totalPages: 328, rating: 4.6, reviewCount: 8912, categories: ['소설', '고전'], format: '종이책',
    description: '안정된 삶을 버리고 그림을 위해 모든 것을 던진 한 남자의 이야기.', region: 'foreign', isEbook: false,
  },
  {
    itemId: 'dev-1003', title: '불편한 편의점', author: '김호연', publisher: '나무옆의자', publishedDate: '2021-04-20',
    isbn: '9791161571188', totalPages: 268, rating: 4.8, reviewCount: 15932, categories: ['소설', '한국소설'], format: '종이책',
    description: '서울역 노숙인이 편의점 야간 알바를 하며 벌어지는 따뜻한 이야기.', region: 'domestic', isEbook: false,
  },
  {
    itemId: 'dev-1004', title: '데미안', author: '헤르만 헤세', publisher: '민음사', publishedDate: '2000-12-20',
    isbn: '9788937460449', totalPages: 232, rating: 4.7, reviewCount: 10234, categories: ['소설', '고전'], format: '종이책',
    region: 'foreign', isEbook: false,
  },
  {
    itemId: 'dev-1005', title: '아주 작은 습관의 힘 (전자책)', author: '제임스 클리어', publisher: '비즈니스북스',
    publishedDate: '2019-02-01', totalPages: 400, rating: 4.7, reviewCount: 2210, categories: ['자기계발'], format: '전자책',
    region: 'foreign', isEbook: true,
  },
  {
    itemId: 'dev-1006', title: '프로젝트 헤일메리', author: '앤디 위어', publisher: 'RHK', publishedDate: '2021-11-24',
    isbn: '9788925588735', totalPages: 696, rating: 4.9, reviewCount: 6031, categories: ['소설', 'SF'], format: '종이책',
    region: 'foreign', isEbook: false,
  },
];

// 상세 화면의 '이런 책은 어때요?' 확인용
DEV_CATALOG[0].relatedItems = [DEV_CATALOG[1], DEV_CATALOG[3]].map(({ itemId, title, author }) => ({ itemId, title, author }));

let nextBookId = 1;
let nextSentenceId = 1;
let nextRecordId = 1;

const library: RegisteredBook[] = [];
const sentencesByBook = new Map<number, Sentence[]>();
const secondsByBook = new Map<number, number>();
const readingDaysByBook = new Map<number, Set<string>>();
let savedThemeId: string | null = null;

function seedBook(entry: CatalogEntry, currentPage: number, daysAgo: number) {
  const created = new Date(Date.now() - daysAgo * 86400000).toISOString();
  const total = entry.totalPages;
  const book: RegisteredBook = {
    bookId: nextBookId++, source: 'CATALOG', itemId: entry.itemId, title: entry.title, author: entry.author,
    publisher: entry.publisher, publishedDate: entry.publishedDate, isbn: entry.isbn, categories: entry.categories,
    format: entry.format, totalPages: total, currentPage, isPublic: true,
    status: total && currentPage >= total ? 'COMPLETED' : currentPage > 0 ? 'READING' : 'NOT_STARTED',
    startedAt: currentPage > 0 ? created : undefined, createdAt: created,
  };
  library.push(book);
  return book;
}

// 개발용 초기 서재
const seeded = seedBook(DEV_CATALOG[0], 180, 12);
seedBook(DEV_CATALOG[1], 66, 5);
seedBook(DEV_CATALOG[3], 232, 30);
seedBook(DEV_CATALOG[5], 0, 1);
sentencesByBook.set(seeded.bookId, [
  { sentenceId: nextSentenceId++, content: '습관은 처음에는 당신을 지배하지만, 나중에는 당신을 자유롭게 한다.', page: 68, createdAt: '2025-10-05' },
  { sentenceId: nextSentenceId++, content: '1퍼센트의 작은 변화가 복리로 쌓이면, 엄청난 차이를 만들어낸다.', page: 128, createdAt: '2025-10-09' },
]);
secondsByBook.set(seeded.bookId, 5 * 3600 + 30 * 60);
readingDaysByBook.set(seeded.bookId, new Set(['d1', 'd2', 'd3']));

function findBook(bookId: number): RegisteredBook {
  const book = library.find(b => b.bookId === bookId);
  if (!book) throw new MockHttpError(404, '서재에서 책을 찾을 수 없어요.');
  return book;
}

function statusOf(currentPage: number, totalPages?: number): RegisteredBook['status'] {
  if (totalPages && currentPage >= totalPages) return 'COMPLETED';
  return currentPage > 0 ? 'READING' : 'NOT_STARTED';
}

export const devMockReadingApi: ReadingApi = {
  async searchBooks({ keyword, category, sort }) {
    await wait();
    const q = keyword.trim().toLowerCase();
    let items = DEV_CATALOG.filter(b =>
      [b.title, b.author, b.isbn ?? ''].some(field => field.toLowerCase().includes(q)),
    ).filter(b => {
      if (category === 'domestic') return b.region === 'domestic' && !b.isEbook;
      if (category === 'foreign') return b.region === 'foreign' && !b.isEbook;
      if (category === 'ebook') return b.isEbook;
      return true;
    });
    if (sort === 'latest') items = [...items].sort((a, b) => (b.publishedDate ?? '').localeCompare(a.publishedDate ?? ''));
    if (sort === 'rating') items = [...items].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return {
      totalCount: items.length,
      items: items.map(({ itemId, title, author, coverImageUrl, publisher, publishedDate, isbn, totalPages, rating, reviewCount }) =>
        ({ itemId, title, author, coverImageUrl, publisher, publishedDate, isbn, totalPages, rating, reviewCount })),
    };
  },

  async getCatalogBook(itemId) {
    await wait();
    const entry = DEV_CATALOG.find(b => b.itemId === itemId);
    if (!entry) throw new MockHttpError(404, '도서 정보를 찾을 수 없어요.');
    const { region: _region, isEbook: _isEbook, ...detail } = entry;
    return detail;
  },

  async registerCatalogBook(request) {
    await wait();
    const entry = DEV_CATALOG.find(b => b.itemId === request.itemId);
    if (!entry) throw new MockHttpError(404, '도서 정보를 찾을 수 없어요.');
    if (library.some(b => b.itemId === request.itemId)) throw new MockHttpError(409, '이미 서재에 등록된 책이에요.');
    const totalPages = request.totalPages ?? entry.totalPages;
    const now = new Date().toISOString();
    const book: RegisteredBook = {
      bookId: nextBookId++, source: 'CATALOG', itemId: entry.itemId, title: entry.title, author: entry.author,
      publisher: entry.publisher, publishedDate: entry.publishedDate, isbn: entry.isbn, coverImageUrl: entry.coverImageUrl,
      categories: entry.categories, format: entry.format, totalPages, currentPage: request.currentPage,
      status: statusOf(request.currentPage, totalPages), isPublic: request.isPublic, goalDate: request.goalDate,
      goalPage: request.goalPage, startedAt: request.currentPage > 0 ? now : undefined, createdAt: now,
    };
    library.push(book);
    return book;
  },

  async registerManualBook({ book: input, ...settings }) {
    await wait();
    const now = new Date().toISOString();
    const book: RegisteredBook = {
      bookId: nextBookId++, source: 'MANUAL', title: input.title, author: input.author, publisher: input.publisher,
      publishedDate: input.publishedDate, isbn: input.isbn, coverImageUrl: input.coverImageUri,
      totalPages: settings.totalPages, currentPage: settings.currentPage,
      status: statusOf(settings.currentPage, settings.totalPages), isPublic: settings.isPublic,
      goalDate: settings.goalDate, goalPage: settings.goalPage,
      startedAt: settings.currentPage > 0 ? now : undefined, createdAt: now,
    };
    library.push(book);
    return book;
  },

  async getLibraryBooks() {
    await wait();
    return library.map(b => ({ ...b }));
  },

  async getBookDetail(bookId) {
    await wait();
    const book = findBook(bookId);
    const seconds = secondsByBook.get(bookId) ?? 0;
    const days = readingDaysByBook.get(bookId)?.size ?? 0;
    const detail: BookDetail = {
      book: { ...book },
      readingSummary: seconds > 0 ? { totalReadingSeconds: seconds, readingDays: days, averageSecondsPerDay: days ? Math.round(seconds / days) : 0 } : null,
      sentences: [...(sentencesByBook.get(bookId) ?? [])].reverse(),
    };
    return detail;
  },

  async removeBook(bookId) {
    await wait();
    const index = library.findIndex(b => b.bookId === bookId);
    if (index < 0) throw new MockHttpError(404, '서재에서 책을 찾을 수 없어요.');
    library.splice(index, 1);
    sentencesByBook.delete(bookId);
  },

  async saveReadingRecord(request) {
    await wait(700);
    const book = findBook(request.bookId);
    if (request.endPage < request.startPage) throw new MockHttpError(400, '종료 페이지는 시작 페이지보다 작을 수 없어요.');
    book.currentPage = request.endPage;
    book.status = statusOf(book.currentPage, book.totalPages);
    book.startedAt = book.startedAt ?? new Date().toISOString();
    secondsByBook.set(book.bookId, (secondsByBook.get(book.bookId) ?? 0) + request.readingTime);
    const days = readingDaysByBook.get(book.bookId) ?? new Set<string>();
    days.add(todayIso());
    readingDaysByBook.set(book.bookId, days);
    if (request.sentence) {
      const list = sentencesByBook.get(book.bookId) ?? [];
      list.push({ sentenceId: nextSentenceId++, content: request.sentence, page: request.endPage, createdAt: todayIso() });
      sentencesByBook.set(book.bookId, list);
    }
    return { readingRecordId: nextRecordId++ };
  },

  async getReadingTimeSummary() {
    // 통계는 FE2 담당 — Mock에서도 제공하지 않는다.
    return null;
  },

  async getLibraryTheme() {
    await wait(200);
    return savedThemeId;
  },

  async saveLibraryTheme(themeId) {
    await wait();
    savedThemeId = themeId;
  },
};
