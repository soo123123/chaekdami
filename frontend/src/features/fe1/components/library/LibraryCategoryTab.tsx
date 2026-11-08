import { LIBRARY_FILTERS } from '../../constants/options';
import type { LibraryFilter } from '../../types/reading';
import { ChipTabs } from '../common/ChipTabs';

type LibraryCategoryTabProps = {
  selectedCategory: LibraryFilter;
  onCategoryChange: (category: LibraryFilter) => void;
  /** 상태별 책 수 (목록을 받기 전에는 생략) */
  counts?: Record<LibraryFilter, number>;
};

/** 전체 / 읽는 중 / 완독 / 읽기 전 필터 */
export function LibraryCategoryTab({ selectedCategory, onCategoryChange, counts }: LibraryCategoryTabProps) {
  return (
    <ChipTabs
      options={LIBRARY_FILTERS}
      selected={selectedCategory}
      onChange={onCategoryChange}
      counts={counts}
      accessibilityLabel="독서 상태 필터"
    />
  );
}
