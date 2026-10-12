import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, HIT_SLOP, radius, spacing } from '../../constants/theme';
import { parseIsoDate, toIsoDate } from '../../utils/format';
import { AppButton } from './AppButton';
import { BottomSheetModal } from './BottomSheetModal';

type DatePickerModalProps = {
  visible: boolean;
  title: string;
  value?: string;
  /** yyyy-MM-dd. 이 날짜 이전은 선택 불가 */
  minDate?: string;
  /** yyyy-MM-dd. 이 날짜 이후는 선택 불가 */
  maxDate?: string;
  onConfirm: (isoDate: string) => void;
  onClear?: () => void;
  onClose: () => void;
};

const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/** 네이티브 의존성 없이 동작하는 달력형 날짜 선택 모달 */
export function DatePickerModal({ visible, title, value, minDate, maxDate, onConfirm, onClear, onClose }: DatePickerModalProps) {
  const initial = (value && parseIsoDate(value)) || new Date();
  const [cursor, setCursor] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1));
  const [selected, setSelected] = useState<string | undefined>(value);

  useEffect(() => {
    if (!visible) return;
    const base = (value && parseIsoDate(value)) || new Date();
    setCursor(new Date(base.getFullYear(), base.getMonth(), 1));
    setSelected(value);
  }, [visible, value]);

  const cells = useMemo(() => {
    const firstWeekday = cursor.getDay();
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const list: (string | null)[] = Array.from({ length: firstWeekday }, () => null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      list.push(toIsoDate(new Date(cursor.getFullYear(), cursor.getMonth(), day)));
    }
    return list;
  }, [cursor]);

  const isDisabled = (iso: string) => (minDate !== undefined && iso < minDate) || (maxDate !== undefined && iso > maxDate);
  const moveMonth = (diff: number) => setCursor(prev => new Date(prev.getFullYear(), prev.getMonth() + diff, 1));

  return (
    <BottomSheetModal visible={visible} title={title} onClose={onClose}>
      <View style={styles.monthRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="이전 달" hitSlop={HIT_SLOP} onPress={() => moveMonth(-1)}>
          <Text style={styles.arrow}>‹</Text>
        </Pressable>
        <Text style={styles.month}>{`${cursor.getFullYear()}년 ${cursor.getMonth() + 1}월`}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="다음 달" hitSlop={HIT_SLOP} onPress={() => moveMonth(1)}>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </View>
      <View style={styles.grid}>
        {WEEK_LABELS.map(label => (
          <Text key={label} style={[styles.cell, styles.weekLabel]}>{label}</Text>
        ))}
        {cells.map((iso, index) => {
          if (!iso) return <View key={`empty-${index}`} style={styles.cell} />;
          const disabled = isDisabled(iso);
          const isSelected = iso === selected;
          return (
            <Pressable
              key={iso}
              accessibilityRole="button"
              accessibilityLabel={iso}
              accessibilityState={{ disabled, selected: isSelected }}
              disabled={disabled}
              onPress={() => setSelected(iso)}
              style={styles.cell}
            >
              <View style={[styles.day, isSelected && styles.daySelected]}>
                <Text style={[styles.dayLabel, disabled && styles.dayDisabled, isSelected && styles.daySelectedLabel]}>
                  {Number(iso.slice(8))}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.actions}>
        {onClear ? (
          <View style={styles.action}>
            <AppButton size="md" variant="secondary" onPress={() => { onClear(); onClose(); }}>선택 해제</AppButton>
          </View>
        ) : null}
        <View style={styles.action}>
          <AppButton size="md" disabled={!selected} onPress={() => { if (selected) { onConfirm(selected); onClose(); } }}>
            확인
          </AppButton>
        </View>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm },
  arrow: { fontSize: 30, color: colors.text, paddingHorizontal: spacing.sm },
  month: { fontSize: 16, fontWeight: '700', color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: 42, alignItems: 'center', justifyContent: 'center' },
  weekLabel: { fontSize: 12, color: colors.secondaryText, textAlign: 'center', lineHeight: 42 },
  day: { width: 36, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: colors.primary },
  dayLabel: { fontSize: 15, color: colors.text },
  dayDisabled: { color: colors.tertiaryText, opacity: 0.5 },
  daySelectedLabel: { color: colors.onPrimary, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
