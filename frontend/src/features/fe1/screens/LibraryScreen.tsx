import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChipTabs } from '../components/common/ChipTabs';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { SortSelector } from '../components/common/SortSelector';
import { EmptyView, ErrorView, LoadingView } from '../components/common/StateView';
import { BookShelfSection } from '../components/library/BookShelfSection';
import { LIBRARY_FILTERS, LIBRARY_SORTS } from '../constants/options';
import { FE1_ROUTES } from '../constants/routes';
import { colors, radius, spacing } from '../constants/theme';
import { useLibraryBooks } from '../hooks/library/useLibraryBooks';
import type { BookStatus } from '../types/reading';

const SECTION_TITLES: Record<BookStatus, string> = {
  READING: '읽는 중',
  COMPLETED: '완독',
  NOT_STARTED: '읽기 전',
};

export function LibraryScreen() {
  const library = useLibraryBooks();
  const { theme } = library;

  const handleAddBook = () => router.push(FE1_ROUTES.search);
  const handleBookPress = (bookId: number) => router.push({ pathname: FE1_ROUTES.detail, params: { bookId: String(bookId) } });
  const handleCustomize = () => router.push(FE1_ROUTES.customize);

  const renderContent = () => {
    if (library.isLoading && !library.books) return <LoadingView message="서재를 불러오는 중이에요…" />;
    if (library.error && !library.books) return <ErrorView error={library.error} onRetry={library.reload} />;
    if (library.isEmpty) {
      return (
        <EmptyView
          title="아직 서재가 비어 있어요"
          message="읽고 있는 책이나 읽고 싶은 책을 등록해보세요."
          actionLabel="책 추가하기"
          onAction={handleAddBook}
        />
      );
    }
    return library.sections.map(section => (
      <BookShelfSection
        key={section.status}
        title={SECTION_TITLES[section.status]}
        books={section.books}
        theme={theme}
        onBookPress={handleBookPress}
        // '책 추가하기' 칸은 읽는 중 책장(전체/읽는 중 필터)에 둔다.
        onAddBook={section.status === 'READING' ? handleAddBook : undefined}
        onTitlePress={library.selectedCategory === 'all' ? () => library.setSelectedCategory(section.status) : undefined}
      />
    ));
  };

  return (
    <ScreenContainer backgroundColor={theme.palette.wall}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.palette.text }]}>나의 서재</Text>
          <Text style={[styles.quote, { color: theme.palette.text }]}>“좋은 책이, 좋은 하루를 만든다.”</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="책 추가하기" onPress={handleAddBook} style={styles.iconButton}>
            <Text style={styles.iconLabel}>＋</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="서재 꾸미기" onPress={handleCustomize} style={styles.iconButton}>
            <Text style={styles.iconLabel}>🎨</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.filters}>
        <View style={styles.tabs}>
          <ChipTabs
            options={LIBRARY_FILTERS}
            selected={library.selectedCategory}
            onChange={library.setSelectedCategory}
            counts={library.books ? library.counts : undefined}
            accessibilityLabel="독서 상태 필터"
          />
        </View>
      </View>
      <View style={styles.sortRow}>
        <SortSelector options={LIBRARY_SORTS} value={library.sortType} onChange={library.setSortType} variant="soft" />
      </View>

      {library.error && library.books ? (
        <Pressable accessibilityRole="button" onPress={library.reload}>
          <Text style={styles.staleError}>최신 정보를 불러오지 못했어요. 눌러서 다시 시도</Text>
        </Pressable>
      ) : null}

      <View style={styles.shelves}>{renderContent()}</View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: spacing.md, gap: spacing.sm },
  titleWrap: { flex: 1, gap: spacing.xs },
  title: { fontSize: 30, fontWeight: '800' },
  quote: { fontSize: 15, opacity: 0.8 },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  iconButton: { width: 46, height: 46, borderRadius: radius.button, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  iconLabel: { fontSize: 20, color: colors.text },
  filters: { flexDirection: 'row' },
  tabs: { flex: 1 },
  sortRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: -spacing.sm },
  staleError: { fontSize: 13, color: colors.danger },
  shelves: { gap: spacing.md + 4, flexGrow: 1 },
});
