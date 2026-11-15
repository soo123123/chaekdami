import { StyleSheet, Text, View } from 'react-native';
import { colors, keepAllWords, spacing } from '../../constants/theme';
import { Icon, type IconName } from '../common/Icon';

export type StatItem = { icon: IconName; label: string; value: string; unit?: string; caption?: string };

/** 3열 통계 표시 (ReadingSummary, ReadingTimeSummary 공용) */
export function StatRow({ items }: { items: StatItem[] }) {
  return (
    <View style={styles.row}>
      {items.map((item, index) => (
        <View key={item.label} style={[styles.cell, index > 0 && styles.border]}>
          <View style={styles.head}>
            <Icon name={item.icon} size={19} color={colors.text} />
            <Text style={styles.label} numberOfLines={2} lineBreakStrategyIOS="hangul-word">{item.label}</Text>
          </View>
          <Text style={styles.value} lineBreakStrategyIOS="hangul-word">
            {item.value}
            {item.unit ? <Text style={styles.unit}>{item.unit}</Text> : null}
          </Text>
          {item.caption ? <Text style={styles.caption} numberOfLines={2}>{item.caption}</Text> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  cell: { flex: 1, gap: 6, paddingHorizontal: spacing.sm },
  border: { borderLeftWidth: 1, borderLeftColor: colors.border },
  head: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  label: { flexShrink: 1, fontSize: 13, color: colors.secondaryText, ...keepAllWords },
  value: { fontSize: 18, fontWeight: '800', color: colors.text, ...keepAllWords },
  unit: { fontSize: 12, fontWeight: '500' },
  caption: { fontSize: 12, color: colors.secondaryText, ...keepAllWords },
});
