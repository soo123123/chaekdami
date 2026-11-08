import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BookInfo } from '../components/book/BookInfo';
import { BottomSheetModal, ConfirmModal } from '../components/common/BottomSheetModal';
import { CatBooksDecor } from '../components/common/Decor';
import { Icon } from '../components/common/Icon';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { ErrorView, InlineError, LoadingView } from '../components/common/StateView';
import { BookAction } from '../components/reading/BookAction';
import { BookProgress } from '../components/reading/BookProgress';
import { ReadingSummary } from '../components/reading/ReadingSummary';
import { RereadingNotice } from '../components/reading/RereadingNotice';
import { SentenceList } from '../components/reading/SentenceList';
import { FE1_ROUTES } from '../constants/routes';
import { colors, HIT_SLOP, spacing } from '../constants/theme';
import { useBookDetail } from '../hooks/book/useBookDetail';
import { useBookIdParam } from '../hooks/common/useRouteParams';
import { formatDate } from '../utils/format';

export function BookDetailScreen() {
  const bookId = useBookIdParam();
  const detail = useBookDetail(bookId);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { book } = detail;

  const header = (
    <ScreenHeader
      onBack={() => router.back()}
      right={book ? (
        <Pressable accessibilityRole="button" accessibilityLabel="더보기" hitSlop={HIT_SLOP} onPress={() => setIsMenuOpen(true)}>
          <Icon name="more" size={28} />
        </Pressable>
      ) : undefined}
    />
  );

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

  const openBookInfo = () => {
    setIsMenuOpen(false);
    if (book?.itemId) router.push({ pathname: FE1_ROUTES.info, params: { itemId: book.itemId } });
  };

  const openRemoveConfirm = () => {
    setIsMenuOpen(false);
    setIsConfirmOpen(true);
  };

  const isCompleted = book?.status === 'COMPLETED';

  return (
    <ScreenContainer
      header={header}
      footer={book ? (
        <BookAction onRemove={() => setIsConfirmOpen(true)} onStartReading={handleStartReading} isCompleted={isCompleted} />
      ) : undefined}
    >
      {detail.isLoading && !book ? <LoadingView /> : null}
      {!detail.isLoading && detail.error && !book ? (
        <ErrorView error={detail.error} onRetry={detail.reload} onBack={() => router.back()} />
      ) : null}
      {book ? (
        <>
          <View style={styles.hero}>
            <CatBooksDecor width={112} style={styles.heroDecor} />
            <BookInfo book={book} coverWidth={112} titleSize={25}>
              {book.startedAt ? (
                <View style={styles.metaRow}>
                  <Icon name="calendar" size={18} color={colors.secondaryText} />
                  <Text style={styles.meta}>{`${formatDate(book.startedAt)} 시작`}</Text>
                </View>
              ) : null}
              <Text style={styles.meta}>
                {[book.totalPages ? `총 ${book.totalPages}쪽` : null, book.format].filter(Boolean).join(' · ') || '페이지 수 정보 없음'}
              </Text>
            </BookInfo>
          </View>

          {isCompleted ? <RereadingNotice /> : null}

          <BookProgress currentPage={book.currentPage} totalPages={book.totalPages} />
          <ReadingSummary summary={detail.readingSummary} startedAt={book.startedAt} />
          <SentenceList sentences={detail.sentences} />
          <InlineError message={detail.removeError} />
        </>
      ) : null}

      <BottomSheetModal visible={isMenuOpen} title={book?.title ?? ''} onClose={() => setIsMenuOpen(false)}>
        <View>
          {book?.itemId ? (
            <MenuItem icon="book" label="책 정보 보기" onPress={openBookInfo} />
          ) : null}
          <MenuItem icon="trash" label="서재에서 제거" danger onPress={openRemoveConfirm} />
        </View>
      </BottomSheetModal>

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

function MenuItem({ icon, label, danger, onPress }: { icon: 'book' | 'trash'; label: string; danger?: boolean; onPress: () => void }) {
  const tint = danger ? colors.danger : colors.text;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.menuItem}>
      <Icon name={icon} size={22} color={tint} />
      <Text style={[styles.menuLabel, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { paddingBottom: spacing.sm },
  heroDecor: { right: -spacing.md - 4, bottom: -4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  meta: { fontSize: 15, color: colors.secondaryText },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, minHeight: 54, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  menuLabel: { fontSize: 16, fontWeight: '600' },
});
