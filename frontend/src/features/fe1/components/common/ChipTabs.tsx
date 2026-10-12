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
};

/** 카테고리/필터 탭 공용 컴포넌트 (BookCategoryTab, LibraryCategoryTab, ThemeCategoryTab) */
export function ChipTabs<T extends string>({ options, selected, onChange, counts, accessibilityLabel }: ChipTabsProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
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
            style={[styles.chip, isSelected && styles.chipSelected]}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
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
  chip: { minHeight: 40, paddingHorizontal: spacing.md + 2, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'center' },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { fontSize: 15, color: colors.text, fontWeight: '500' },
  labelSelected: { color: colors.onPrimary, fontWeight: '700' },
});
