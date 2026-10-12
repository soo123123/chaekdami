import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BookInfo } from '../components/book/BookInfo';
import { BookSpecTable } from '../components/book/BookSpecTable';
import { ExpandableText } from '../components/book/ExpandableText';
import { RatingText } from '../components/book/RatingText';
import { AppButton } from '../components/common/AppButton';
import { BookCover } from '../components/common/BookCover';
import { Card } from '../components/common/Card';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { ErrorView, LoadingView } from '../components/common/StateView';
import { FE1_ROUTES } from '../constants/routes';
import { colors, radius, spacing } from '../constants/theme';
import { useBookInfo } from '../hooks/book/useBookInfo';
import { useItemIdParam } from '../hooks/common/useRouteParams';
import { formatDate } from '../utils/format';

export function BookInfoScreen() {
  const itemId = useItemIdParam();
  const { book, isLoading, error, reload } = useBookInfo(itemId);

  const header = <ScreenHeader title="책 정보" onBack={() => router.back()} />;

  if (!itemId) {
    return (
      <ScreenContainer header={header}>
        <ErrorView error={{ kind: 'client', message: '책 정보를 찾을 수 없어요. 다시 검색해주세요.' }} onBack={() => router.back()} />
      </ScreenContainer>
    );
  }

  const handleRegister = () => router.push({ pathname: FE1_ROUTES.register, params: { itemId } });

  return (
    <ScreenContainer
      header={header}
      footer={book ? <AppButton onPress={handleRegister} icon={<Text style={styles.btnIcon}>📖</Text>}>이 책을 등록하기</AppButton> : undefined}
    >
      {isLoading ? <LoadingView /> : null}
      {!isLoading && error ? <ErrorView error={error} onRetry={reload} onBack={() => router.back()} /> : null}
      {!isLoading && !error && book ? (
        <>
          <BookInfo book={book} coverWidth={140}>
            <RatingText rating={book.rating} reviewCount={book.reviewCount} size={16} />
            {book.highlight ? (
              <View style={styles.highlight}>
                <Text style={styles.highlightText}>{`“ ${book.highlight} ”`}</Text>
              </View>
            ) : null}
          </BookInfo>

          <BookSpecTable
            rows={[
              { label: '출판사', value: book.publisher },
              { label: '출간일', value: book.publishedDate ? formatDate(book.publishedDate) : undefined },
              { label: 'ISBN', value: book.isbn },
              { label: '페이지 수', value: book.totalPages ? `${book.totalPages}쪽` : undefined },
              { label: '형태', value: book.format },
            ]}
          />

          {book.description ? (
            <Card title="책 소개">
              <ExpandableText text={book.description} />
            </Card>
          ) : null}

          {book.relatedItems && book.relatedItems.length > 0 ? (
            <Card title="이런 책은 어때요?">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.related}>
                {book.relatedItems.map(item => (
                  <Pressable
                    key={item.itemId}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.title} 책 정보 보기`}
                    onPress={() => router.push({ pathname: FE1_ROUTES.info, params: { itemId: item.itemId } })}
                    style={styles.relatedItem}
                  >
                    <BookCover uri={item.coverImageUrl} title={item.title} width={56} />
                    <View style={styles.relatedText}>
                      <Text style={styles.relatedTitle} numberOfLines={2}>{item.title}</Text>
                      <Text style={styles.relatedAuthor} numberOfLines={1}>{item.author}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </Card>
          ) : null}
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  btnIcon: { fontSize: 18 },
  highlight: { backgroundColor: colors.surfaceMuted, borderRadius: radius.input, padding: spacing.sm + 4 },
  highlightText: { fontSize: 14, lineHeight: 21, color: colors.text, textAlign: 'center' },
  related: { gap: spacing.md },
  relatedItem: { flexDirection: 'row', gap: spacing.sm + 4, width: 220, alignItems: 'center' },
  relatedText: { flex: 1, gap: 4 },
  relatedTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  relatedAuthor: { fontSize: 13, color: colors.secondaryText },
});
