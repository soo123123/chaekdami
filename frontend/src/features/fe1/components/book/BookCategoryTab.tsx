import type { Option } from '../../constants/options';
import type { SearchCategory } from '../../types/reading';
import { ChipTabs } from '../common/ChipTabs';

type BookCategoryTabProps = {
  categories: Option<SearchCategory>[];
  selectedCategory: SearchCategory;
  onChange: (category: SearchCategory) => void;
};

/** 전체 / 국내도서 / 해외도서 / 전자책 카테고리 선택 */
export function BookCategoryTab({ categories, selectedCategory, onChange }: BookCategoryTabProps) {
  return <ChipTabs options={categories} selected={selectedCategory} onChange={onChange} accessibilityLabel="도서 카테고리" layout="stretch" />;
}
