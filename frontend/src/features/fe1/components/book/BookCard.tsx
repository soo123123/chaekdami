import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import type { BookSearchItem, RegisteredBook } from '../../types/reading';
import { calcProgress, formatDate } from '../../utils/format';
import { BookCover } from '../common/BookCover';
import { Icon } from '../common/Icon';
import { BookProgress } from '../reading/BookProgress';
import { RatingText } from './RatingText';

type SearchBookCardProps = {
  variant?: 'search';
  book: BookSearchItem;
  /** 책 정보 클릭 → BookInfoScreen */
  onPress: (itemId: string) => void;
  /** + 버튼 클릭 → BookRegisterScreen */
  onRegister: (itemId: string) => void;
};

type ShelfBookCardProps = {
  variant: 'shelf';
  book: RegisteredBook;
  /** 책 클릭 → BookDetailScreen */
  onPress: (bookId: number) => void;
};

export type BookCardProps = SearchBookCardProps | ShelfBookCardProps;

/** 책 정보 표시 및 선택. search: 검색 결과 행 / shelf: 서재 책장 위 표지 + 진행률 */
export function BookCard(props: BookCardProps) {
  return props.variant === 'shelf' ? <ShelfBookCard {...props} /> : <SearchBookCard {...props} />;
}

function SearchBookCard({ book, onPress, onRegister }: SearchBookCardProps) {
  const meta = [book.publisher, book.publishedDate ? formatDate(book.publishedDate) : undefined].filter(Boolean).join('  |  ');
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${book.title} 책 정보 보기`}
        onPress={() => onPress(book.itemId)}
        style={styles.main}
      >
        <View style={styles.coverShadow}>
          <BookCover uri={book.coverImageUrl} title={book.title} width={64} height={80} />
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
          <Text style={styles.sub} numberOfLines={1}>{book.author}</Text>
          {meta ? <Text style={styles.sub} numberOfLines={1}>{meta}</Text> : null}
          <RatingText rating={book.rating} reviewCount={book.reviewCount} size={14} />
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${book.title} 바로 등록하기`}
        onPress={() => onRegister(book.itemId)}
        style={({ pressed }) => [styles.add, pressed && styles.pressed]}
      >
        <Icon name="plus" size={28} color={colors.onPrimary} />
      </Pressable>
    </View>
  );
}

export const SHELF_COVER_WIDTH = 84;
export const SHELF_COVER_HEIGHT = 124;

function ShelfBookCard({ book, onPress }: ShelfBookCardProps) {
  const percent = calcProgress(book.currentPage, book.totalPages);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${book.title}, ${percent === null ? '진행률 정보 없음' : `${percent}% 읽음`}`}
      onPress={() => onPress(book.bookId)}
      style={styles.shelfBook}
    >
      <BookCover uri={book.coverImageUrl} title={book.title} author={book.author} width={SHELF_COVER_WIDTH} height={SHELF_COVER_HEIGHT} />
      {book.status !== 'NOT_STARTED' ? (
        <BookProgress currentPage={book.currentPage} totalPages={book.totalPages} variant="overlay" />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm + 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderStrong, gap: spacing.sm },
  main: { flex: 1, flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  coverShadow: { borderRadius: 6, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  info: { flex: 1, gap: 3 },
  title: { fontSize: 17, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.secondaryText },
  add: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.8 },
  shelfBook: { width: SHELF_COVER_WIDTH, borderRadius: radius.cover, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 5, shadowOffset: { width: 2, height: 3 }, elevation: 4 },
});
