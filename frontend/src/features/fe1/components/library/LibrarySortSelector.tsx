import { LIBRARY_SORTS } from '../../constants/options';
import type { LibrarySort } from '../../types/reading';
import { SortSelector } from '../common/SortSelector';

type LibrarySortSelectorProps = { sortType: LibrarySort; onSortChange: (sortType: LibrarySort) => void };

/** 서재 책 정렬 기준 선택 */
export function LibrarySortSelector({ sortType, onSortChange }: LibrarySortSelectorProps) {
  return <SortSelector options={LIBRARY_SORTS} value={sortType} onChange={onSortChange} variant="soft" />;
}
