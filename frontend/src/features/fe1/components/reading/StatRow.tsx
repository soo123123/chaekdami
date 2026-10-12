import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';

export type StatItem = { icon: string; label: string; value: string; caption?: string };

/** 3열 통계 표시 (ReadingSummary, ReadingTimeSummary 공용) */
export function StatRow({ items }: { items: StatItem[] }) {
  return (
    <View style={styles.row}>
      {items.map((item, index) => (
        <View key={item.label} style={[styles.cell, index > 0 && styles.border]}>
          <View style={styles.head}>
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
          </View>
          <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>{item.value}</Text>
          {item.caption ? <Text style={styles.caption} numberOfLines={2}>{item.caption}</Text> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  cell: { flex: 1, gap: 4, paddingHorizontal: spacing.sm },
  border: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border },
  head: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  icon: { fontSize: 15 },
  label: { fontSize: 13, color: colors.secondaryText, flexShrink: 1 },
  value: { fontSize: 18, fontWeight: '800', color: colors.text },
  caption: { fontSize: 12, color: colors.secondaryText },
});
