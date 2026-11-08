import { SEARCH_SORTS } from '../../constants/options';
import type { SearchSort } from '../../types/reading';
import { SortSelector } from '../common/SortSelector';

type SearchSortSelectorProps = { sort: SearchSort; onChange: (sort: SearchSort) => void };

/** 검색 결과 정렬 기준 선택 */
export function SearchSortSelector({ sort, onChange }: SearchSortSelectorProps) {
  return <SortSelector options={SEARCH_SORTS} value={sort} onChange={onChange} />;
}
