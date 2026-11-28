import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BookInfo } from '../components/book/BookInfo';
import { BookSpecTable } from '../components/book/BookSpecTable';
import { ExpandableText } from '../components/book/ExpandableText';
import { RatingText } from '../components/book/RatingText';
import { RegisterBookButton } from '../components/book/RegisterBookButton';
import { BookCover } from '../components/common/BookCover';
import { Card } from '../components/common/Card';
import { Icon } from '../components/common/Icon';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { ErrorView, LoadingView } from '../components/common/StateView';
import { FE1_ROUTES } from '../constants/routes';
import { colors, keepAllWords, radius, serifFont, spacing } from '../constants/theme';
import { useBookInfo } from '../hooks/book/useBookInfo';
import { useItemIdParam, useRegisteredParam } from '../hooks/common/useRouteParams';
import { formatDate } from '../utils/format';

export function BookInfoScreen() {
  const itemId = useItemIdParam();
  // 서재 → 책 상세에서 들어온 경우 (이미 등록된 책)
  const isRegistered = useRegisteredParam();
  const { book, isLoading, error, reload } = useBookInfo(itemId);
  // 찜하기 버튼은 뺐다. 저장할 API가 없어 화면을 나가면 사라졌다 (ASK-12)
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
      footer={book ? <RegisterBookButton onPress={handleRegister} registered={isRegistered} /> : undefined}
    >
      {isLoading ? <LoadingView /> : null}
      {!isLoading && error ? <ErrorView error={error} onRetry={reload} onBack={() => router.back()} /> : null}
      {!isLoading && !error && book ? (
        <>
          <BookInfo book={book} coverWidth={140} titleSize={23}>
            <RatingText rating={book.rating} reviewCount={book.reviewCount} size={17} />
            {book.highlight ? (
              <View style={styles.highlight}>
                <Text style={styles.highlightText}>{`“${book.highlight}”`}</Text>
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
            <Card title="이런 책은 어때요?" right={<Icon name="chevronRight" size={22} color={colors.text} />}>
              <View style={styles.related}>
                {book.relatedItems.slice(0, 2).map(item => (
                  <Pressable
                    key={item.itemId}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.title} 책 정보 보기`}
                    onPress={() => router.push({ pathname: FE1_ROUTES.info, params: { itemId: item.itemId } })}
                    style={styles.relatedItem}
                  >
                    <BookCover uri={item.coverImageUrl} title={item.title} width={50} height={64} />
                    <View style={styles.relatedText}>
                      <Text style={styles.relatedTitle} numberOfLines={2}>{item.title}</Text>
                      <Text style={styles.relatedAuthor} numberOfLines={2}>{item.author}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </Card>
          ) : null}
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  highlight: { backgroundColor: '#F4ECE2', borderRadius: radius.input + 2, paddingVertical: spacing.md, paddingHorizontal: spacing.md, marginTop: spacing.xs },
  highlightText: { fontFamily: serifFont, fontSize: 15, lineHeight: 24, color: '#4A4540', textAlign: 'center', ...keepAllWords },
  related: { flexDirection: 'row', gap: spacing.md },
  relatedItem: { flex: 1, flexDirection: 'row', gap: spacing.sm + 4, alignItems: 'center' },
  relatedText: { flex: 1, gap: 4 },
  relatedTitle: { fontSize: 15, fontWeight: '800', color: colors.text, ...keepAllWords },
  relatedAuthor: { fontSize: 13, color: colors.secondaryText },
});
