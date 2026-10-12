import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';

type Row = { label: string; value?: string };

/** 출판사·출간일·ISBN 등. 값이 없는 행은 표시하지 않는다. */
export function BookSpecTable({ rows }: { rows: Row[] }) {
  const visible = rows.filter(row => row.value);
  if (visible.length === 0) return null;
  return (
    <View style={styles.table}>
      {visible.map(row => (
        <View key={row.label} style={styles.row}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value} selectable>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  row: { flexDirection: 'row', minHeight: 46, alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingHorizontal: spacing.sm },
  label: { width: 96, fontSize: 15, color: colors.secondaryText },
  value: { flex: 1, fontSize: 15, color: colors.text },
});
