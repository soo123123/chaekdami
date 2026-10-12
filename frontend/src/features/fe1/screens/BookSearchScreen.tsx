import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { BookCard } from '../components/book/BookCard';
import { RecentSearchList } from '../components/book/RecentSearchList';
import { SearchBar } from '../components/book/SearchBar';
import { ChipTabs } from '../components/common/ChipTabs';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { SortSelector } from '../components/common/SortSelector';
import { EmptyView, ErrorView, LoadingView } from '../components/common/StateView';
import { SEARCH_CATEGORIES, SEARCH_SORTS } from '../constants/options';
import { FE1_ROUTES } from '../constants/routes';
import { colors, radius, spacing } from '../constants/theme';
import { useBookSearch } from '../hooks/book/useBookSearch';

export function BookSearchScreen() {
  const search = useBookSearch();

  const handleOpenInfo = (itemId: string) => router.push({ pathname: FE1_ROUTES.info, params: { itemId } });
  const handleRegister = (itemId: string) => router.push({ pathname: FE1_ROUTES.register, params: { itemId } });
  const handleManualRegister = () => router.push(FE1_ROUTES.manualRegister);

  const manualButton = (
    <Pressable accessibilityRole="button" onPress={handleManualRegister} style={styles.manual}>
      <Text style={styles.manualLabel}>+ 수동등록</Text>
    </Pressable>
  );

  const renderBody = () => {
    switch (search.status) {
      case 'loading':
        return <LoadingView message="책을 찾고 있어요…" />;
      case 'error':
        return search.error ? <ErrorView error={search.error} onRetry={search.retry} /> : null;
      case 'empty':
        return (
          <EmptyView
            title="검색 결과가 없어요"
            message="검색어를 바꾸거나, 책 정보를 직접 입력해 등록할 수 있어요."
            actionLabel="수동으로 등록하기"
            onAction={handleManualRegister}
          />
        );
      case 'success':
        return null; // 결과 목록은 FlatList에서 렌더링
      default:
        return (
          <View style={styles.hint}>
            <Text style={styles.hintText}>읽고 싶은 책을 검색해 서재에 담아보세요.</Text>
            <View style={styles.hintAction}>{manualButton}</View>
          </View>
        );
    }
  };

  const header = (
    <View style={styles.top}>
      <SearchBar value={search.searchKeyword} onChange={search.setSearchKeyword} onSearch={search.searchBooks} />
      <ChipTabs
        options={SEARCH_CATEGORIES}
        selected={search.selectedCategory}
        onChange={search.setSelectedCategory}
        accessibilityLabel="도서 카테고리"
      />
      <RecentSearchList
        keywords={search.recentSearches}
        onSelect={search.selectRecentSearch}
        onClearAll={search.clearRecentSearches}
      />
      {search.status !== 'initial' ? (
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>
            {search.status === 'success' ? `검색 결과 ${search.totalCount.toLocaleString()}개` : '검색 결과'}
          </Text>
          <View style={styles.resultActions}>
            {manualButton}
            <SortSelector options={SEARCH_SORTS} value={search.sort} onChange={search.setSort} />
          </View>
        </View>
      ) : null}
      {renderBody()}
    </View>
  );

  return (
    <ScreenContainer scrollable={false} header={<ScreenHeader title="책 등록" onBack={() => router.back()} />}>
      <FlatList
        data={search.status === 'success' ? search.books : []}
        keyExtractor={item => item.itemId}
        renderItem={({ item }) => <BookCard book={item} onPress={handleOpenInfo} onRegister={handleRegister} />}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.xl },
  top: { gap: spacing.md + 4, paddingBottom: spacing.xs },
  resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.sm },
  resultTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  resultActions: { flexDirection: 'row', gap: spacing.sm },
  manual: { minHeight: 40, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'center' },
  manualLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  hint: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  hintText: { fontSize: 14, color: colors.secondaryText },
  hintAction: { flexDirection: 'row' },
});
