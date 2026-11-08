import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/common/AppButton';
import { BottomSheetModal } from '../components/common/BottomSheetModal';
import { Icon } from '../components/common/Icon';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { ErrorView, InlineError, LoadingView } from '../components/common/StateView';
import { CurrentThemePreview } from '../components/library/CurrentThemePreview';
import { ThemeCard } from '../components/library/ThemeCard';
import { ThemeCategoryTab } from '../components/library/ThemeCategoryTab';
import { THEME_CATEGORIES } from '../constants/options';
import { colors, radius, softShadow, spacing } from '../constants/theme';
import { themeHeroImage } from '../constants/themeImages';
import { useLibraryCustomize } from '../hooks/library/useLibraryCustomize';

const COLUMNS = 3;

export function LibraryCustomizeScreen() {
  const customize = useLibraryCustomize();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { selectedTheme } = customize;
  const previewImage = themeHeroImage(selectedTheme.themeId);

  const rows: (typeof customize.themes)[] = [];
  for (let i = 0; i < customize.themes.length; i += COLUMNS) rows.push(customize.themes.slice(i, i + COLUMNS));

  const isReady = !customize.isLoading && !customize.loadError;

  return (
    <ScreenContainer
      header={(
        <ScreenHeader
          title="서재 꾸미기"
          subtitle="나만의 서재를 꾸며보세요!"
          align="center"
          onBack={() => router.back()}
          right={isReady ? (
            <Pressable accessibilityRole="button" onPress={() => setIsPreviewOpen(true)} style={styles.previewButton}>
              <Icon name="eye" size={18} color={colors.text} />
              <Text style={styles.previewLabel}>미리보기</Text>
            </Pressable>
          ) : undefined}
        />
      )}
    >
      {customize.isLoading ? <LoadingView message="테마 정보를 불러오는 중이에요…" /> : null}
      {!customize.isLoading && customize.loadError ? (
        <ErrorView error={customize.loadError} onRetry={customize.reload} onBack={() => router.back()} />
      ) : null}

      {isReady ? (
        <>
          <CurrentThemePreview
            theme={selectedTheme}
            isApplied={selectedTheme.themeId === customize.appliedThemeId}
            isSaving={customize.isSaving}
          />
          <ThemeCategoryTab
            categories={THEME_CATEGORIES}
            selectedCategory={customize.selectedCategory}
            onChange={customize.setSelectedCategory}
          />
          <View style={styles.grid} accessibilityRole="radiogroup">
            {rows.map(row => (
              <View key={row.map(t => t.themeId).join('-')} style={styles.row}>
                {row.map(theme => (
                  <ThemeCard
                    key={theme.themeId}
                    theme={theme}
                    isSelected={theme.themeId === selectedTheme.themeId}
                    isApplied={theme.themeId === customize.appliedThemeId}
                    onPress={themeId => void customize.selectTheme(themeId)}
                  />
                ))}
                {Array.from({ length: COLUMNS - row.length }, (_, i) => <View key={`pad-${i}`} style={styles.pad} />)}
              </View>
            ))}
          </View>
          {customize.saveMessage ? <Text style={styles.success} accessibilityLiveRegion="polite">{customize.saveMessage}</Text> : null}
          <InlineError message={customize.saveError} />
          <View style={styles.tipRow}>
            <Icon name="bulb" size={18} color={colors.star} />
            <Text style={styles.tip}>테마는 언제든지 변경할 수 있어요.</Text>
          </View>
        </>
      ) : null}

      <BottomSheetModal visible={isPreviewOpen} title={`${selectedTheme.name} 미리보기`} onClose={() => setIsPreviewOpen(false)}>
        {previewImage ? (
          <Image source={previewImage} style={styles.previewImage} contentFit="cover" accessibilityLabel={`${selectedTheme.name} 테마 이미지`} />
        ) : null}
        <Text style={styles.previewDesc}>{selectedTheme.description.replace('\n', ' ')}</Text>
        <AppButton size="md" variant="secondary" onPress={() => setIsPreviewOpen(false)}>닫기</AppButton>
      </BottomSheetModal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  previewButton: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: spacing.sm + 4, borderRadius: radius.input, backgroundColor: colors.surface, ...softShadow },
  previewLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  grid: { gap: spacing.md + 2 },
  row: { flexDirection: 'row', gap: spacing.sm + 4 },
  pad: { flex: 1 },
  success: { fontSize: 14, color: colors.primary, fontWeight: '600', textAlign: 'center' },
  tipRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  tip: { fontSize: 14, color: colors.secondaryText },
  previewImage: { width: '100%', aspectRatio: 1.6, borderRadius: radius.card },
  previewDesc: { fontSize: 15, color: colors.secondaryText, textAlign: 'center' },
});
