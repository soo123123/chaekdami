import { readingApi } from '@/features/fe1/api/readingApi';
import type { BookCatalogDetail } from '../../types/reading';
import { useAsyncResource } from '../common/useAsyncResource';

/** itemId 기반 외부 도서 상세 조회 */
export function useBookInfo(itemId: string | null) {
  const { data, error, isLoading, reload } = useAsyncResource<BookCatalogDetail>(
    () => readingApi.getCatalogBook(itemId as string),
    [itemId],
    { enabled: itemId !== null },
  );
  return { book: data, error, isLoading, reload };
}
