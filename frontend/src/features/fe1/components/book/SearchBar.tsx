import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, HIT_SLOP, radius, spacing } from '../../constants/theme';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
};

export function SearchBar({ value, onChange, onSearch }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon} accessibilityElementsHidden importantForAccessibility="no">⌕</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSearch}
        placeholder="책 제목, 저자, ISBN으로 검색하세요."
        placeholderTextColor={colors.tertiaryText}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        style={styles.input}
        accessibilityLabel="도서 검색어"
      />
      {value.length > 0 ? (
        <Pressable accessibilityRole="button" accessibilityLabel="검색어 지우기" hitSlop={HIT_SLOP} onPress={() => onChange('')}>
          <Text style={styles.clear}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 52, paddingHorizontal: spacing.md, borderRadius: radius.button, backgroundColor: colors.surfaceMuted },
  icon: { fontSize: 22, color: colors.text, transform: [{ scaleX: -1 }] },
  input: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: spacing.sm },
  clear: { fontSize: 14, color: colors.secondaryText, paddingHorizontal: spacing.xs },
});
