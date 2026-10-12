import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import type { BookSearchItem } from '../../types/reading';
import { formatDate } from '../../utils/format';
import { BookCover } from '../common/BookCover';
import { RatingText } from './RatingText';

type BookCardProps = {
  book: BookSearchItem;
  /** 책 정보 클릭 → BookInfoScreen */
  onPress: (itemId: string) => void;
  /** + 버튼 클릭 → BookRegisterScreen */
  onRegister: (itemId: string) => void;
};

/** 검색 결과 도서 카드 */
export function BookCard({ book, onPress, onRegister }: BookCardProps) {
  const meta = [book.publisher, book.publishedDate ? formatDate(book.publishedDate) : undefined].filter(Boolean).join('  |  ');
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${book.title} 책 정보 보기`}
        onPress={() => onPress(book.itemId)}
        style={styles.main}
      >
        <BookCover uri={book.coverImageUrl} title={book.title} width={64} />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
          <Text style={styles.sub} numberOfLines={1}>{book.author}</Text>
          {meta ? <Text style={styles.sub} numberOfLines={1}>{meta}</Text> : null}
          <RatingText rating={book.rating} reviewCount={book.reviewCount} />
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${book.title} 바로 등록하기`}
        onPress={() => onRegister(book.itemId)}
        style={({ pressed }) => [styles.add, pressed && styles.pressed]}
      >
        <Text style={styles.addLabel}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm + 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, gap: spacing.sm },
  main: { flex: 1, flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  info: { flex: 1, gap: 3 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  sub: { fontSize: 14, color: colors.secondaryText },
  add: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.8 },
  addLabel: { color: colors.onPrimary, fontSize: 28, lineHeight: 30, fontWeight: '300' },
});
