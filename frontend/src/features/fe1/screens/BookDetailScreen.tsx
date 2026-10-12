import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BookInfo } from '../components/book/BookInfo';
import { AppButton } from '../components/common/AppButton';
import { ConfirmModal } from '../components/common/BottomSheetModal';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { ErrorView, InlineError, LoadingView } from '../components/common/StateView';
import { BookProgress } from '../components/reading/BookProgress';
import { ReadingSummary } from '../components/reading/ReadingSummary';
import { SentenceList } from '../components/reading/SentenceList';
import { FE1_ROUTES } from '../constants/routes';
import { colors, radius, spacing } from '../constants/theme';
import { useBookDetail } from '../hooks/book/useBookDetail';
import { useBookIdParam } from '../hooks/common/useRouteParams';
import { formatDate } from '../utils/format';

export function BookDetailScreen() {
  const bookId = useBookIdParam();
  const detail = useBookDetail(bookId);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { book } = detail;

  const header = <ScreenHeader onBack={() => router.back()} />;

  if (bookId === null) {
    return (
      <ScreenContainer header={header}>
        <ErrorView error={{ kind: 'client', message: '책 정보를 찾을 수 없어요.' }} onBack={() => router.back()} />
      </ScreenContainer>
    );
  }

  const handleStartReading = () => router.push({ pathname: FE1_ROUTES.readingStart, params: { bookId: String(bookId) } });

  const handleRemove = async () => {
    const removed = await detail.removeBook();
    // 서버 삭제 성공 후에만 화면을 닫는다. 서재는 포커스 시 다시 조회한다.
    setIsConfirmOpen(false);
    if (removed) router.back();
  };

  const isCompleted = book?.status === 'COMPLETED';

  return (
    <ScreenContainer
      header={header}
      footer={book ? (
        <View style={styles.actions}>
          <View style={styles.removeWrap}>
            <AppButton variant="dangerOutline" onPress={() => setIsConfirmOpen(true)} icon={<Text style={styles.trash}>🗑</Text>}>
              책 제거
            </AppButton>
          </View>
          <View style={styles.startWrap}>
            <AppButton onPress={handleStartReading} icon={<Text style={styles.trash}>📖</Text>}>
              {isCompleted ? '다시 읽기' : '독서 시작'}
            </AppButton>
          </View>
        </View>
      ) : undefined}
    >
      {detail.isLoading && !book ? <LoadingView /> : null}
      {!detail.isLoading && detail.error && !book ? (
        <ErrorView error={detail.error} onRetry={detail.reload} onBack={() => router.back()} />
      ) : null}
      {book ? (
        <>
          <BookInfo book={book} coverWidth={120}>
            {book.startedAt ? <Text style={styles.meta}>{`📅  ${formatDate(book.startedAt)} 시작`}</Text> : null}
            <Text style={styles.meta}>
              {[book.totalPages ? `총 ${book.totalPages}쪽` : null, book.format].filter(Boolean).join(' · ') || '페이지 수 정보 없음'}
            </Text>
          </BookInfo>

          {isCompleted ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>🎉 완독한 책이에요. 다시 읽으면 새로운 독서 기록으로 쌓여요.</Text>
            </View>
          ) : null}

          <BookProgress currentPage={book.currentPage} totalPages={book.totalPages} />
          <ReadingSummary summary={detail.readingSummary} startedAt={book.startedAt} />
          <SentenceList sentences={detail.sentences} />
          <InlineError message={detail.removeError} />
        </>
      ) : null}

      <ConfirmModal
        visible={isConfirmOpen}
        title="책을 서재에서 제거할까요?"
        message={book ? `'${book.title}'과(와) 관련된 독서 기록이 함께 사라질 수 있어요.` : ''}
        confirmLabel="제거하기"
        destructive
        isLoading={detail.isRemoving}
        onConfirm={handleRemove}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  meta: { fontSize: 14, color: colors.secondaryText },
  notice: { backgroundColor: colors.primarySoft, borderRadius: radius.input, padding: spacing.sm + 4 },
  noticeText: { fontSize: 14, color: colors.primary, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: spacing.sm + 4 },
  removeWrap: { flex: 1 },
  startWrap: { flex: 1.25 },
  trash: { fontSize: 18 },
});
