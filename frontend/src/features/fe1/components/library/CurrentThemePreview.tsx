import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import type { LibraryTheme } from '../../types/reading';
import { ShelfIllustration } from './ShelfIllustration';

type CurrentThemePreviewProps = {
  theme: LibraryTheme;
  /** 선택한 테마가 현재 저장(적용)된 테마인지 */
  isApplied: boolean;
};

export function CurrentThemePreview({ theme, isApplied }: CurrentThemePreviewProps) {
  return (
    <View style={styles.card}>
      <ShelfIllustration theme={theme} height={190} spineCount={10} />
      <View style={styles.overlay}>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>{isApplied ? '현재 테마' : '미리보기'}</Text>
        </View>
        <Text style={[styles.name, { color: theme.palette.text }]}>{theme.name}</Text>
        <Text style={[styles.desc, { color: theme.palette.text }]}>{theme.description}</Text>
        {isApplied ? (
          <View style={styles.applied}><Text style={styles.appliedLabel}>✓ 적용 중</Text></View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, overflow: 'hidden' },
  overlay: { ...StyleSheet.absoluteFill, padding: spacing.md, gap: spacing.xs + 2, width: '58%' },
  badge: { alignSelf: 'flex-start', backgroundColor: colors.primary, borderRadius: radius.input, paddingHorizontal: spacing.sm + 2, paddingVertical: 3 },
  badgeLabel: { color: colors.onPrimary, fontSize: 12, fontWeight: '600' },
  name: { fontSize: 22, fontWeight: '800' },
  desc: { fontSize: 13, lineHeight: 19, opacity: 0.9 },
  applied: { alignSelf: 'flex-start', marginTop: spacing.xs, backgroundColor: colors.primary, borderRadius: radius.button, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  appliedLabel: { color: colors.onPrimary, fontSize: 14, fontWeight: '700' },
});
