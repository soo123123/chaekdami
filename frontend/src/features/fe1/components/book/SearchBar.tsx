import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors, HIT_SLOP, noWebOutline, radius, spacing } from '../../constants/theme';
import { Icon } from '../common/Icon';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  /** 바코드(ISBN) 스캔 버튼 */
  onPressScan?: () => void;
};

export function SearchBar({ value, onChange, onSearch, onPressScan }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Icon name="search" size={22} color={colors.text} />
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
          <Icon name="close" size={18} color={colors.secondaryText} />
        </Pressable>
      ) : null}
      {onPressScan ? (
        <Pressable accessibilityRole="button" accessibilityLabel="바코드로 검색" hitSlop={HIT_SLOP} onPress={onPressScan}>
          <Icon name="scan" size={24} color={colors.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2, minHeight: 54, paddingHorizontal: spacing.md, borderRadius: radius.button + 2, backgroundColor: colors.surfaceMuted },
  input: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: spacing.sm, ...noWebOutline },
});
