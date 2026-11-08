import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

export function TagList({ tags }: { tags?: string[] }) {
  if (!tags || tags.length === 0) return null;
  return (
    <View style={styles.row}>
      {tags.map(tag => (
        <View key={tag} style={styles.tag}>
          <Text style={styles.label}>{tag}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: { paddingHorizontal: spacing.sm + 4, paddingVertical: spacing.xs + 2, borderRadius: radius.input, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.tagBackground },
  label: { fontSize: 13, color: colors.text },
});
