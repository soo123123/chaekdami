import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import { calcProgress, digitsOnly } from '../../utils/format';
import { InlineError } from '../common/StateView';
import { ReadingProgress } from './ReadingProgress';

type ReadingStatusInputProps = {
  currentPage: number;
  totalPages?: number;
  onChange: (currentPage: number) => void;
  /** 전체 페이지 수를 직접 입력할 수 있는지 (수동 등록 / 외부 정보에 페이지 수가 없는 경우) */
  isTotalEditable?: boolean;
  onTotalChange?: (totalPages: number | undefined) => void;
  error?: string | null;
};

/** 현재 읽은 페이지(+ 전체 페이지) 입력 */
export function ReadingStatusInput({ currentPage, totalPages, onChange, isTotalEditable = false, onTotalChange, error }: ReadingStatusInputProps) {
  const max = totalPages && totalPages > 0 ? totalPages : undefined;
  const percent = calcProgress(currentPage, max);
  const step = (diff: number) => {
    const next = Math.max(0, currentPage + diff);
    onChange(max ? Math.min(max, next) : next);
  };

  return (
    <View style={styles.box}>
      <View style={styles.header}>
        <Text style={styles.title}>현재 읽은 페이지</Text>
        <Text style={styles.desc}>지금까지 읽은 페이지 수를 입력해주세요.</Text>
      </View>
      <View style={styles.row}>
        <View style={styles.stepper}>
          <Pressable accessibilityRole="button" accessibilityLabel="한 페이지 줄이기" disabled={currentPage <= 0} onPress={() => step(-1)} style={styles.stepButton}>
            <Text style={[styles.stepGlyph, currentPage <= 0 && styles.dim]}>−</Text>
          </Pressable>
          <TextInput
            value={String(currentPage)}
            onChangeText={text => onChange(Number(digitsOnly(text) || '0'))}
            keyboardType="number-pad"
            style={styles.pageInput}
            accessibilityLabel="현재 읽은 페이지"
            selectTextOnFocus
          />
          <Pressable accessibilityRole="button" accessibilityLabel="한 페이지 늘리기" disabled={!!max && currentPage >= max} onPress={() => step(1)} style={styles.stepButton}>
            <Text style={[styles.stepGlyph, !!max && currentPage >= max && styles.dim]}>+</Text>
          </Pressable>
        </View>
        {isTotalEditable ? (
          <View style={styles.totalEdit}>
            <Text style={styles.slash}>/</Text>
            <TextInput
              value={totalPages ? String(totalPages) : ''}
              onChangeText={text => {
                const digits = digitsOnly(text);
                onTotalChange?.(digits ? Number(digits) : undefined);
              }}
              placeholder="페이지 수 (선택)"
              placeholderTextColor={colors.tertiaryText}
              keyboardType="number-pad"
              style={styles.totalInput}
              accessibilityLabel="전체 페이지 수"
            />
            <Text style={styles.slash}>쪽</Text>
          </View>
        ) : (
          <Text style={styles.total}>
            {max ? `/ ${max}쪽 (${percent}%)` : '/ 페이지 수 정보 없음'}
          </Text>
        )}
      </View>
      <ReadingProgress currentPage={currentPage} totalPages={max} showLabels={false} showCaption={false} />
      <InlineError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.surfaceMuted, borderRadius: radius.card - 4, padding: spacing.md, gap: spacing.md },
  header: { gap: spacing.xs },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  desc: { fontSize: 13, color: colors.secondaryText },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFE5D8', borderRadius: radius.input, minHeight: 52, flexGrow: 1, flexBasis: 170, maxWidth: 260 },
  stepButton: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  stepGlyph: { fontSize: 26, color: colors.primary, fontWeight: '500' },
  dim: { opacity: 0.3 },
  pageInput: { flex: 1, textAlign: 'center', fontSize: 22, fontWeight: '700', color: colors.text, paddingVertical: spacing.xs },
  total: { fontSize: 15, color: colors.secondaryText },
  totalEdit: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexGrow: 1 },
  totalInput: { flex: 1, minWidth: 110, minHeight: 52, borderRadius: radius.input, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.sm, fontSize: 15, textAlign: 'center', color: colors.text },
  slash: { fontSize: 16, color: colors.secondaryText },
});
