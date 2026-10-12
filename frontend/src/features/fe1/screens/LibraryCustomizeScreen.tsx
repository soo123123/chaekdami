import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/common/AppButton';
import { ChipTabs } from '../components/common/ChipTabs';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { ErrorView, InlineError, LoadingView } from '../components/common/StateView';
import { CurrentThemePreview } from '../components/library/CurrentThemePreview';
import { ThemeCard } from '../components/library/ThemeCard';
import { THEME_CATEGORIES } from '../constants/options';
import { colors, spacing } from '../constants/theme';
import { useLibraryCustomize } from '../hooks/library/useLibraryCustomize';

const COLUMNS = 3;

export function LibraryCustomizeScreen() {
  const customize = useLibraryCustomize();

  const rows: (typeof customize.themes)[] = [];
  for (let i = 0; i < customize.themes.length; i += COLUMNS) rows.push(customize.themes.slice(i, i + COLUMNS));

  return (
    <ScreenContainer
      header={<ScreenHeader title="서재 꾸미기" align="center" onBack={() => router.back()} />}
      footer={customize.loadError ? undefined : (
        <AppButton onPress={customize.saveTheme} isLoading={customize.isSaving} disabled={!customize.hasChanges}>
          {customize.hasChanges ? `'${customize.selectedTheme.name}' 적용하기` : '적용 중인 테마예요'}
        </AppButton>
      )}
    >
      <Text style={styles.subtitle}>나만의 서재를 꾸며보세요!</Text>

      {customize.isLoading ? <LoadingView message="테마 정보를 불러오는 중이에요…" /> : null}
      {!customize.isLoading && customize.loadError ? (
        <ErrorView error={customize.loadError} onRetry={customize.reload} onBack={() => router.back()} />
      ) : null}

      {!customize.isLoading && !customize.loadError ? (
        <>
          <CurrentThemePreview
            theme={customize.selectedTheme}
            isApplied={customize.selectedTheme.themeId === customize.appliedThemeId}
          />
          <ChipTabs
            options={THEME_CATEGORIES}
            selected={customize.selectedCategory}
            onChange={customize.setSelectedCategory}
            accessibilityLabel="테마 카테고리"
          />
          <View style={styles.grid} accessibilityRole="radiogroup">
            {rows.map(row => (
              <View key={row.map(t => t.themeId).join('-')} style={styles.row}>
                {row.map(theme => (
                  <ThemeCard
                    key={theme.themeId}
                    theme={theme}
                    isSelected={theme.themeId === customize.selectedTheme.themeId}
                    isApplied={theme.themeId === customize.appliedThemeId}
                    onPress={customize.selectTheme}
                  />
                ))}
                {Array.from({ length: COLUMNS - row.length }, (_, i) => <View key={`pad-${i}`} style={styles.pad} />)}
              </View>
            ))}
          </View>
          {customize.saveMessage ? <Text style={styles.success} accessibilityLiveRegion="polite">{customize.saveMessage}</Text> : null}
          <InlineError message={customize.saveError} />
          <Text style={styles.tip}>💡 테마는 언제든지 변경할 수 있어요.</Text>
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontSize: 15, color: colors.secondaryText, textAlign: 'center', marginTop: -spacing.sm },
  grid: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm + 4 },
  pad: { flex: 1 },
  success: { fontSize: 14, color: colors.primary, fontWeight: '600', textAlign: 'center' },
  tip: { fontSize: 13, color: colors.secondaryText, textAlign: 'center' },
});
