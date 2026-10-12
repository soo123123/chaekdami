import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Option } from '../../constants/options';
import { colors, radius, spacing } from '../../constants/theme';
import { BottomSheetModal } from './BottomSheetModal';

type SortSelectorProps<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: 'outline' | 'soft';
};

/** 정렬 기준 선택 (SearchSortSelector, LibrarySortSelector) */
export function SortSelector<T extends string>({ options, value, onChange, variant = 'outline' }: SortSelectorProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const current = options.find(option => option.value === value);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`정렬 기준: ${current?.label ?? ''}`}
        onPress={() => setIsOpen(true)}
        style={[styles.trigger, variant === 'soft' && styles.soft]}
      >
        <Text style={styles.triggerLabel}>{current?.label}</Text>
        <Text style={styles.caret}>⌄</Text>
      </Pressable>
      <BottomSheetModal visible={isOpen} title="정렬 기준" onClose={() => setIsOpen(false)}>
        <View>
          {options.map(option => {
            const isSelected = option.value === value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                onPress={() => { onChange(option.value); setIsOpen(false); }}
                style={styles.option}
              >
                <Text style={[styles.optionLabel, isSelected && styles.optionSelected]}>{option.label}</Text>
                {isSelected ? <Text style={styles.check}>✓</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 40, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  soft: { backgroundColor: 'rgba(255,249,242,0.85)' },
  triggerLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  caret: { fontSize: 14, color: colors.text, marginTop: -6 },
  option: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  optionLabel: { fontSize: 16, color: colors.text },
  optionSelected: { fontWeight: '700', color: colors.primary },
  check: { fontSize: 16, color: colors.primary, fontWeight: '700' },
});
