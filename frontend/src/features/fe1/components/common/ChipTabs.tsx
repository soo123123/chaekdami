import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import type { Option } from '../../constants/options';

type ChipTabsProps<T extends string> = {
  options: Option<T>[];
  selected: T;
  onChange: (value: T) => void;
  /** 옵션별 개수 표시 (예: 읽는 중 3) */
  counts?: Partial<Record<T, number>>;
  accessibilityLabel?: string;
  /** stretch: 칩이 가로 폭을 나눠 쓴다 (도서 검색 카테고리) */
  layout?: 'scroll' | 'stretch';
};

/** 카테고리/필터 탭 공용 컴포넌트 (BookCategoryTab, LibraryCategoryTab, ThemeCategoryTab) */
export function ChipTabs<T extends string>({ options, selected, onChange, counts, accessibilityLabel, layout = 'scroll' }: ChipTabsProps<T>) {
  const isStretch = layout === 'stretch';
  return (
    <ScrollView
      horizontal
      scrollEnabled={!isStretch}
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={[styles.row, isStretch && styles.stretchRow]}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map(option => {
        const isSelected = option.value === selected;
        const count = counts?.[option.value];
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(option.value)}
            style={[styles.chip, isStretch && styles.chipStretch, isSelected && styles.chipSelected]}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]} numberOfLines={1}>
              {option.label}
              {count !== undefined ? ` ${count}` : ''}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: spacing.xs },
  scroll: { flexGrow: 0 },
  stretchRow: { flexGrow: 1 },
  chip: { minHeight: 40, paddingHorizontal: spacing.md + 2, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  chipStretch: { flex: 1, paddingHorizontal: spacing.sm },
  chipSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primaryLight },
  label: { fontSize: 15, color: colors.text, fontWeight: '500' },
  labelSelected: { color: colors.onPrimary, fontWeight: '700' },
});
