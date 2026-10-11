export type BookStatus = 'READING' | 'COMPLETED' | 'NOT_STARTED';
export type RegisteredBook = { bookId: number; title: string; author: string; coverImageUrl?: string; totalPages?: number; currentPage: number; status: BookStatus };
/** External catalog itemId is distinct from internal bookId. */
export type BookSearchItem = { itemId: string; title: string; author: string; coverImageUrl?: string; publisher?: string; publishedDate?: string; isbn?: string; totalPages?: number };
export type ReadingSessionDraft = { bookId: number; startPage: number; endPage: number; elapsedSeconds: number; memorableSentence?: string };
