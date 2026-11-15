import type { Option } from '../../constants/options';
import type { ThemeCategory } from '../../types/reading';
import { ChipTabs } from '../common/ChipTabs';

type ThemeCategoryTabProps = {
  categories: Option<ThemeCategory>[];
  selectedCategory: ThemeCategory;
  onChange: (category: ThemeCategory) => void;
};

/** 테마 카테고리 선택 */
export function ThemeCategoryTab({ categories, selectedCategory, onChange }: ThemeCategoryTabProps) {
  return <ChipTabs options={categories} selected={selectedCategory} onChange={onChange} accessibilityLabel="테마 카테고리" />;
}
