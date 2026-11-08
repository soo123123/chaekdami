import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, HIT_SLOP, radius, spacing } from '../../constants/theme';
import { Icon } from '../common/Icon';

type RecentSearchListProps = {
  keywords: string[];
  onSelect: (keyword: string) => void;
  onClearAll: () => void;
};

export function RecentSearchList({ keywords, onSelect, onClearAll }: RecentSearchListProps) {
  if (keywords.length === 0) return null;
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>최근 검색어</Text>
        <Pressable accessibilityRole="button" hitSlop={HIT_SLOP} onPress={onClearAll}>
          <Text style={styles.clear}>전체 삭제</Text>
        </Pressable>
      </View>
      <View style={styles.list}>
        {keywords.map(keyword => (
          <Pressable
            key={keyword}
            accessibilityRole="button"
            accessibilityLabel={`최근 검색어 ${keyword}로 검색`}
            onPress={() => onSelect(keyword)}
            style={styles.chip}
          >
            <Icon name="clock" size={18} />
            <Text style={styles.keyword} numberOfLines={1}>{keyword}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm + 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 19, fontWeight: '800', color: colors.text },
  clear: { fontSize: 14, color: colors.secondaryText },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm + 2 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 40, maxWidth: '100%', paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  keyword: { fontSize: 15, color: colors.text, flexShrink: 1 },
});
