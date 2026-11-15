import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { BottomTabBar } from '@/components/BottomTabBar';
import { ConfirmModal } from '../components/common/BottomSheetModal';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { SortSelector } from '../components/common/SortSelector';
import { Icon } from '../components/common/Icon';
import { EmptyView, ErrorView, LoadingView } from '../components/common/StateView';
import { CommunityBookCard } from '../components/community/CommunityBookCard';
import { CompletedBookCarousel } from '../components/community/CompletedBookCarousel';
import { MyReviewCard } from '../components/community/MyReviewCard';
import { OneLineReviewForm } from '../components/community/OneLineReviewForm';
import { ReviewListItem } from '../components/community/ReviewListItem';
import { ReviewReportSheet } from '../components/community/ReviewReportSheet';
import { REVIEW_SORTS } from '../constants/options';
import { FE1_ROUTES } from '../constants/routes';
import { colors, keepAllWords, radius, softShadow, spacing } from '../constants/theme';
import { useBookReviews } from '../hooks/community/useBookReviews';
import { useCompletedBooks } from '../hooks/community/useCompletedBooks';
import { useMyReview } from '../hooks/community/useMyReview';
import { useBookIdParam } from '../hooks/common/useRouteParams';
import type { PublicReview, ReviewReportRequest } from '../types/community';

/**
 * 커뮤니티 — 내가 완독한 책의 별점 통계와 다른 독자들의 한줄평을 보고, 내 한줄평을 남긴다.
 * - 완독 + ISBN이 있는 책만 다룬다 (한줄평·별점 API가 ISBN 기준).
 * - 내 한줄평은 목록에서 빼고 작성 영역(내 한줄평 카드)에서만 보여준다.
 */
export function CommunityScreen() {
  const completed = useCompletedBooks(useBookIdParam());
  const book = completed.selectedBook;
  const reviews = useBookReviews(book?.isbn ?? null);
  const mine = useMyReview(book?.bookId ?? null, reviews.refresh);

  const [reportTarget, setReportTarget] = useState<PublicReview | null>(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  /** 내 한줄평은 위 카드에서 보여주므로 목록에서는 뺀다 */
  const otherReviews = useMemo(() => reviews.reviews.filter(r => !r.isMine), [reviews.reviews]);

  const { report } = reviews;
  const handleReport = useCallback(
    (request: ReviewReportRequest) => (reportTarget ? report(reportTarget.reviewId, request) : Promise.resolve(false)),
    [reportTarget, report],
  );

  const pageHeader = (
    <View style={styles.pageHeader}>
      <Text accessibilityRole="header" style={styles.pageTitle}>커뮤니티</Text>
      <View style={styles.pageSubtitleRow}>
        <Text style={styles.pageSubtitle}>완독한 책으로 다른 독자들과 이야기를 나눠보세요.</Text>
        <Icon name="leaf" size={16} color={colors.primary} />
      </View>
    </View>
  );

  const renderBody = () => {
    if (completed.isLoading) return <LoadingView message="완독한 책을 불러오는 중이에요…" />;
    if (completed.error) return <ErrorView error={completed.error} onRetry={completed.reload} />;
    if (!book) {
      return (
        <EmptyView
          title="아직 커뮤니티에 참여할 수 있는 책이 없어요"
          message={
            completed.manualOnlyCount > 0
              ? '직접 등록한 책은 커뮤니티를 이용할 수 없어요.\n검색으로 등록한 책을 완독하면 한줄평을 나눌 수 있어요.'
              : '책을 완독하면 다른 독자들과\n별점과 한줄평을 나눌 수 있어요.'
          }
          actionLabel="서재로 가기"
          onAction={() => router.dismissTo(FE1_ROUTES.library)}
        />
      );
    }

    const listHeader = (
      <View style={styles.headerStack}>
        {pageHeader}

        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>내가 완독한 책</Text>
          <CompletedBookCarousel books={completed.books} selectedBookId={book.bookId} onSelect={completed.selectBook} />
          {completed.manualOnlyCount > 0 ? (
            <Text style={styles.note}>직접 등록한 책 {completed.manualOnlyCount}권은 커뮤니티를 이용할 수 없어요.</Text>
          ) : null}
        </View>

        <CommunityBookCard
          book={book}
          summary={reviews.summary}
          isSummaryLoading={reviews.isSummaryLoading}
          hasSummaryError={!!reviews.summaryError}
        />

        {mine.isLoading ? (
          <View style={styles.mineLoading}><ActivityIndicator color={colors.primary} /></View>
        ) : mine.isFormOpen ? (
          <OneLineReviewForm
            isEditing={mine.isEditing}
            rating={mine.rating}
            onRatingChange={mine.setRating}
            oneLine={mine.oneLine}
            onOneLineChange={mine.setOneLine}
            isSpoiler={mine.isSpoiler}
            onSpoilerChange={mine.setIsSpoiler}
            isSaving={mine.isSaving}
            error={mine.formError}
            onSubmit={() => void mine.submit()}
            onCancel={mine.cancelEdit}
          />
        ) : mine.myReview ? (
          <MyReviewCard
            review={mine.myReview}
            isSaving={mine.isSaving}
            onEdit={mine.startEdit}
            onClearOneLine={() => setIsClearConfirmOpen(true)}
          />
        ) : null}

        <View style={styles.listHeader}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>한줄평 모아보기</Text>
          <SortSelector options={REVIEW_SORTS} value={reviews.sort} onChange={reviews.setSort} size="sm" />
        </View>
      </View>
    );

    const renderListState = () => {
      if (reviews.isLoading && otherReviews.length === 0) return <LoadingView message="한줄평을 불러오는 중이에요…" />;
      if (reviews.error) return <ErrorView error={reviews.error} onRetry={reviews.reloadReviews} />;
      return <EmptyView title="아직 다른 독자의 한줄평이 없어요" message="첫 번째로 이 책에 대한 생각을 남겨보세요." />;
    };

    return (
      <FlatList
        data={otherReviews}
        keyExtractor={item => String(item.reviewId)}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <ReviewListItem review={item} onToggleLike={reviews.toggleLike} onMore={setReportTarget} />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separatorWrap}><View style={styles.separator} /></View>}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={<View style={styles.listItem}>{renderListState()}</View>}
        ListFooterComponent={
          otherReviews.length > 0 ? (
            <View style={[styles.listItem, styles.listFooter]}>
              {reviews.isLoadingMore ? <ActivityIndicator color={colors.primary} /> : null}
            </View>
          ) : <View style={styles.listFooter} />
        }
        onEndReached={() => void reviews.loadMore()}
        onEndReachedThreshold={0.4}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  return (
    <View style={styles.flex}>
      <ScreenContainer scrollable={false}>
        {book || completed.isLoading || completed.error ? null : pageHeader}
        {renderBody()}
      </ScreenContainer>
      <BottomTabBar active="community" />

      <ReviewReportSheet visible={!!reportTarget} onClose={() => setReportTarget(null)} onSubmit={handleReport} />
      <ConfirmModal
        visible={isClearConfirmOpen}
        title="한줄평을 지울까요?"
        message="별점은 그대로 남고, 한줄평 문장만 지워져요."
        confirmLabel="지우기"
        destructive
        isLoading={mine.isSaving}
        onCancel={() => setIsClearConfirmOpen(false)}
        onConfirm={async () => {
          await mine.clearOneLine();
          setIsClearConfirmOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  listContent: { paddingBottom: spacing.lg },
  headerStack: { gap: spacing.md, paddingBottom: spacing.xs },
  pageHeader: { gap: spacing.xs, paddingTop: spacing.md },
  pageTitle: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  pageSubtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pageSubtitle: { flexShrink: 1, fontSize: 14, color: colors.secondaryText, ...keepAllWords },
  section: { gap: spacing.sm + 4, padding: spacing.md, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(236, 227, 216, 0.6)', ...softShadow },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  note: { fontSize: 12, color: colors.secondaryText },
  mineLoading: { minHeight: 120, alignItems: 'center', justifyContent: 'center' },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  listItem: { paddingHorizontal: spacing.xs },
  separatorWrap: { paddingHorizontal: spacing.xs },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong },
  listFooter: { minHeight: spacing.lg, alignItems: 'center', justifyContent: 'center' },
});
