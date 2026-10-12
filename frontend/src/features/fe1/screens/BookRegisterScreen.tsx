import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { BookInfo } from '../components/book/BookInfo';
import { RegisterButton } from '../components/book/RegisterButton';
import { Card } from '../components/common/Card';
import { CatBooksDecor } from '../components/common/Decor';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { ErrorView, InlineError, LoadingView } from '../components/common/StateView';
import { PublicSetting } from '../components/reading/PublicSetting';
import { ReadingGoalSetting } from '../components/reading/ReadingGoalSetting';
import { ReadingStatusInput } from '../components/reading/ReadingStatusInput';
import { FE1_ROUTES } from '../constants/routes';
import { colors, spacing } from '../constants/theme';
import { useBookInfo } from '../hooks/book/useBookInfo';
import { useBookRegistration } from '../hooks/book/useBookRegistration';
import { useItemIdParam } from '../hooks/common/useRouteParams';

export function BookRegisterScreen() {
  const itemId = useItemIdParam();
  const { book, isLoading: isBookLoading, error, reload } = useBookInfo(itemId);
  const form = useBookRegistration({ kind: 'catalog', itemId });

  // 외부 정보에 페이지 수가 없으면 사용자가 직접 입력한다.
  const catalogTotal = book?.totalPages;
  const totalPages = catalogTotal ?? form.totalPages;

  const header = <ScreenHeader title="책 등록하기" onBack={() => router.back()} />;

  const handleRegister = async () => {
    const registered = await form.registerBook(catalogTotal);
    // 등록 성공 응답 확인 후에만 서재로 이동한다.
    if (registered) router.dismissTo(FE1_ROUTES.library);
  };

  if (!itemId) {
    return (
      <ScreenContainer header={header}>
        <ErrorView error={{ kind: 'client', message: '등록할 책 정보가 없어요. 다시 검색해주세요.' }} onBack={() => router.back()} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      header={header}
      footer={book ? (
        <RegisterButton onPress={handleRegister} isLoading={form.isLoading} />
      ) : undefined}
    >
      {isBookLoading ? <LoadingView /> : null}
      {!isBookLoading && error ? <ErrorView error={error} onRetry={reload} onBack={() => router.back()} /> : null}
      {!isBookLoading && !error && book ? (
        <>
          <View style={styles.bookCardWrap}>
            <Card style={styles.bookCard}>
              <BookInfo book={book} coverWidth={104} titleSize={22}>
                <Text style={styles.meta}>
                  {[catalogTotal ? `총 ${catalogTotal}쪽` : null, book.format].filter(Boolean).join(' · ')}
                </Text>
              </BookInfo>
            </Card>
            <CatBooksDecor width={116} style={styles.decor} />
          </View>

          <Card title="읽기 현황 설정">
            <ReadingStatusInput
              currentPage={form.currentPage}
              totalPages={totalPages}
              onChange={form.setCurrentPage}
              isTotalEditable={!catalogTotal}
              onTotalChange={form.setTotalPages}
              error={form.pageError}
            />
            <ReadingGoalSetting
              goalDate={form.goalDate}
              goalPage={form.goalPage}
              currentPage={form.currentPage}
              totalPages={totalPages}
              onDateChange={form.setGoalDate}
              onPageChange={form.setGoalPage}
            />
          </Card>

          <PublicSetting isPublic={form.isPublic} onChange={form.setIsPublic} />
          <InlineError message={form.submitError} />
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  bookCardWrap: { marginTop: 88 },
  bookCard: { paddingTop: spacing.lg },
  decor: { right: -spacing.xs, top: -92 },
  meta: { fontSize: 15, color: colors.secondaryText },
});
