import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import type { BookId, RegisteredBook } from '../../types/reading';
import { BookCover } from '../common/BookCover';

const COVER_WIDTH = 104;

type Props = {
  books: RegisteredBook[];
  selectedBookId: BookId | null;
  onSelect: (bookId: BookId) => void;
};

/** '내가 완독한 책' 가로 목록. 선택한 책은 초록 테두리로 표시한다. */
export function CompletedBookCarousel({ books, selectedBookId, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {books.map(book => {
        const isSelected = book.bookId === selectedBookId;
        return (
          <Pressable
            key={book.bookId}
            accessibilityRole="button"
            accessibilityLabel={`${book.title} 커뮤니티 보기`}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(book.bookId)}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <View style={[styles.coverFrame, isSelected && styles.coverSelected]}>
              <BookCover uri={book.coverImageUrl} title={book.title} author={book.author} width={COVER_WIDTH} />
              <View style={styles.badge}>
                <Text style={styles.badgeLabel}>100%</Text>
              </View>
            </View>
            <Text numberOfLines={1} style={[styles.title, isSelected && styles.titleSelected]}>{book.title}</Text>
            <Text numberOfLines={1} style={styles.author}>{book.author}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.md - 4, paddingRight: spacing.xs },
  item: { width: COVER_WIDTH + 6, gap: 2 },
  pressed: { opacity: 0.85 },
  coverFrame: { padding: 1, borderRadius: radius.cover + 3, borderWidth: 2, borderColor: 'transparent', marginBottom: spacing.xs },
  coverSelected: { borderColor: colors.primaryLight },
  badge: { position: 'absolute', top: 6, right: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.primary },
  badgeLabel: { fontSize: 11, fontWeight: '700', color: colors.onPrimary },
  title: { fontSize: 14, fontWeight: '700', color: colors.text },
  titleSelected: { color: colors.primary },
  author: { fontSize: 12, color: colors.secondaryText },
});
