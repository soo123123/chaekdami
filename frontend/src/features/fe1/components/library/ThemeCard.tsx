import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import { THEME_THUMBNAILS } from '../../constants/themeImages';
import type { LibraryTheme } from '../../types/reading';
import { Icon } from '../common/Icon';
import { ShelfIllustration } from './ShelfIllustration';

type ThemeCardProps = {
  theme: LibraryTheme;
  isSelected: boolean;
  isApplied: boolean;
  onPress: (themeId: string) => void;
};

export function ThemeCard({ theme, isSelected, isApplied, onPress }: ThemeCardProps) {
  const thumbnail = THEME_THUMBNAILS[theme.themeId];
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={`${theme.name} 테마${isApplied ? ', 적용 중' : ''}`}
      onPress={() => onPress(theme.themeId)}
      style={styles.card}
    >
      <View style={[styles.frame, isSelected && styles.frameSelected]}>
        {thumbnail ? (
          <Image source={thumbnail} style={styles.image} contentFit="cover" transition={120} />
        ) : (
          <ShelfIllustration theme={theme} height={92} spineCount={7} />
        )}
        {isSelected ? (
          <View style={styles.check}><Icon name="check" size={16} color="#FFFFFF" /></View>
        ) : null}
      </View>
      <Text style={[styles.name, isSelected && styles.nameSelected]} numberOfLines={1}>{theme.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, gap: spacing.sm, alignItems: 'center' },
  frame: { width: '100%', aspectRatio: 1.2, borderRadius: radius.input, overflow: 'hidden', borderWidth: 2.5, borderColor: 'transparent' },
  frameSelected: { borderColor: colors.primaryLight },
  image: { width: '100%', height: '100%' },
  check: { position: 'absolute', right: 6, bottom: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  name: { fontSize: 14, color: colors.text, fontWeight: '600' },
  nameSelected: { color: colors.primaryLight, fontWeight: '700' },
});
