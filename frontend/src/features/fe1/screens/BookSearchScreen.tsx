import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { readingApi } from '@/features/fe1/api/readingApi';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { BookCard } from '../components/book/BookCard';
import { BookCategoryTab } from '../components/book/BookCategoryTab';
import { ManualRegisterButton } from '../components/book/ManualRegisterButton';
import { RecentSearchList } from '../components/book/RecentSearchList';
import { SearchBar } from '../components/book/SearchBar';
import { SearchSortSelector } from '../components/book/SearchSortSelector';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { EmptyView, ErrorView, LoadingView } from '../components/common/StateView';
import { SEARCH_CATEGORIES } from '../constants/options';
import { FE1_ROUTES } from '../constants/routes';
import { colors, spacing } from '../constants/theme';
import { useBookSearch } from '../hooks/book/useBookSearch';
import { useAsyncResource } from '../hooks/common/useAsyncResource';
import type { BookSearchItem } from '../types/reading';

export function BookSearchScreen() {
  const search = useBookSearch();
  // 이미 서재에 있는 책은 검색 결과에서 표시한다. 등록을 눌러 409를 받기 전에 알 수 있게 (ISSUE-BUG-20). 못 불러와도 검색은 그대로 쓴다.
  const { data: libraryBooks } = useAsyncResource(() => readingApi.getLibraryBooks().catch(() => []), []);
  const findRegistered = useMemo(() => {
    const byItemId = new Map<string, number>();
    const byIsbn = new Map<string, number>();
    for (const book of libraryBooks ?? []) {
      if (book.itemId) byItemId.set(book.itemId, book.bookId);
      if (book.isbn) byIsbn.set(book.isbn.replace(/[-\s]/g, ''), book.bookId);
    }
    return (item: BookSearchItem) =>
      byItemId.get(item.itemId) ?? (item.isbn ? byIsbn.get(item.isbn.replace(/[-\s]/g, '')) : undefined);
  }, [libraryBooks]);
  // 바코드 스캔은 카메라 의존성(expo-camera) 도입 후 연결한다.
  const [scanNotice, setScanNotice] = useState<string | null>(null);

  const handleOpenInfo = (itemId: string) => router.push({ pathname: FE1_ROUTES.info, params: { itemId } });
  const handleRegister = (itemId: string) => router.push({ pathname: FE1_ROUTES.register, params: { itemId } });
  const handleManualRegister = () => router.push(FE1_ROUTES.manualRegister);
  const handleOpenRegistered = (bookId: number) => router.push({ pathname: FE1_ROUTES.detail, params: { bookId: String(bookId) } });

  const manualButton = <ManualRegisterButton onPress={handleManualRegister} />;

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
      <SearchBar
        value={search.searchKeyword}
        onChange={search.setSearchKeyword}
        onSearch={search.searchBooks}
        onPressScan={() => setScanNotice('바코드 스캔은 준비 중이에요. ISBN을 직접 입력해 검색해주세요.')}
      />
      {scanNotice ? <Text style={styles.notice} accessibilityLiveRegion="polite">{scanNotice}</Text> : null}
      <BookCategoryTab
        categories={SEARCH_CATEGORIES}
        selectedCategory={search.selectedCategory}
        onChange={search.setSelectedCategory}
      />
      <RecentSearchList
        keywords={search.recentSearches}
        onSelect={search.selectRecentSearch}
        onClearAll={search.clearRecentSearches}
      />
      {search.status !== 'initial' ? (
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>
            {/* totalCount는 세트 상품을 빼기 전 수라 실제보다 클 수 있다 (TODO-33) */}
            {search.status === 'success' ? `검색 결과 약 ${search.totalCount.toLocaleString()}개` : '검색 결과'}
          </Text>
          <View style={styles.resultActions}>
            {manualButton}
            <SearchSortSelector sort={search.sort} onChange={search.setSort} />
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
        renderItem={({ item }) => (
          <BookCard
            book={item}
            onPress={handleOpenInfo}
            onRegister={handleRegister}
            registeredBookId={findRegistered(item)}
            onOpenRegistered={handleOpenRegistered}
          />
        )}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        onEndReached={() => void search.loadMore()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={search.isLoadingMore ? <ActivityIndicator color={colors.primary} style={styles.more} /> : null}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.xl },
  more: { paddingVertical: spacing.md },
  top: { gap: spacing.md + 4, paddingBottom: spacing.xs },
  notice: { fontSize: 13, color: colors.secondaryText, marginTop: -spacing.sm },
  resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.sm },
  resultTitle: { fontSize: 21, fontWeight: '800', color: colors.text },
  resultActions: { flexDirection: 'row', gap: spacing.sm },
  hint: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  hintText: { fontSize: 14, color: colors.secondaryText },
  hintAction: { flexDirection: 'row' },
});
