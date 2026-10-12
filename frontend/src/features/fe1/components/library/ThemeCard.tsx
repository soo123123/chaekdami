import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import type { LibraryTheme } from '../../types/reading';
import { ShelfIllustration } from './ShelfIllustration';

type ThemeCardProps = {
  theme: LibraryTheme;
  isSelected: boolean;
  isApplied: boolean;
  onPress: (themeId: string) => void;
};

export function ThemeCard({ theme, isSelected, isApplied, onPress }: ThemeCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={`${theme.name} 테마${isApplied ? ', 적용 중' : ''}`}
      onPress={() => onPress(theme.themeId)}
      style={styles.card}
    >
      <View style={[styles.frame, isSelected && styles.frameSelected]}>
        <ShelfIllustration theme={theme} height={92} spineCount={7} />
        {isSelected ? (
          <View style={styles.check}><Text style={styles.checkLabel}>✓</Text></View>
        ) : null}
      </View>
      <Text style={[styles.name, isSelected && styles.nameSelected]} numberOfLines={1}>{theme.name}</Text>
      {isApplied ? <Text style={styles.applied}>적용 중</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, gap: spacing.xs + 2, alignItems: 'center' },
  frame: { width: '100%', borderRadius: radius.input, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  frameSelected: { borderColor: colors.primary },
  check: { position: 'absolute', right: 6, bottom: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  checkLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  name: { fontSize: 13, color: colors.text, fontWeight: '500' },
  nameSelected: { color: colors.primary, fontWeight: '700' },
  applied: { fontSize: 11, color: colors.primary },
});
