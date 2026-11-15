import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import type { LibraryTheme, RegisteredBook } from '../../types/reading';
import { BookCard, SHELF_COVER_HEIGHT, SHELF_COVER_WIDTH } from '../book/BookCard';
import { Icon } from '../common/Icon';
import { AddBookButton } from './AddBookButton';

type BookShelfSectionProps = {
  title: string;
  books: RegisteredBook[];
  theme: LibraryTheme;
  onBookPress: (bookId: number) => void;
  /** 책 추가하기 칸 표시 */
  onAddBook?: () => void;
  onTitlePress?: () => void;
};

/** 독서 상태별 책장 한 칸 (책장 틀은 LibraryScreen이 그린다) */
export function BookShelfSection({ title, books, theme, onBookPress, onAddBook, onTitlePress }: BookShelfSectionProps) {
  const { shelf, shelfEdge } = theme.palette;
  return (
    <View style={styles.section}>
      <View style={[styles.back, { backgroundColor: shelfEdge }]}>
        <View style={[styles.backShade, { backgroundColor: shelf }]} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {books.map(book => (
            <BookCard key={book.bookId} variant="shelf" book={book} onPress={onBookPress} />
          ))}
          {onAddBook ? <AddBookButton onPress={onAddBook} width={SHELF_COVER_WIDTH} height={SHELF_COVER_HEIGHT} /> : null}
          {books.length === 0 && !onAddBook ? (
            <View style={styles.emptySlot}><Text style={styles.emptyText}>아직 책이 없어요</Text></View>
          ) : null}
        </ScrollView>
      </View>
      {/* 선반 판 */}
      <View style={[styles.board, { backgroundColor: shelf, borderBottomColor: shelfEdge }]}>
        <View style={styles.boardHighlight} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title} ${books.length}권만 보기`}
        disabled={!onTitlePress}
        onPress={onTitlePress}
        style={styles.label}
      >
        <Text style={styles.labelText}>{`${title} ${books.length}`}</Text>
        <Icon name="chevronRight" size={16} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingTop: 22 },
  back: { overflow: 'hidden' },
  backShade: { ...StyleSheet.absoluteFill, opacity: 0.55 },
  row: { gap: spacing.sm + 6, paddingHorizontal: spacing.md, paddingTop: spacing.md + 6, paddingBottom: 2, minHeight: SHELF_COVER_HEIGHT + spacing.md + 8, alignItems: 'flex-end' },
  board: { height: 14, borderBottomWidth: 4 },
  boardHighlight: { height: 3, backgroundColor: 'rgba(255,255,255,0.28)' },
  label: { position: 'absolute', top: 6, left: spacing.md - 4, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: colors.shelfLabel, borderRadius: radius.input, paddingLeft: spacing.sm + 4, paddingRight: spacing.sm, paddingVertical: 5, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  labelText: { fontSize: 16, fontWeight: '800', color: colors.text },
  emptySlot: { height: SHELF_COVER_HEIGHT, justifyContent: 'center', paddingHorizontal: spacing.md },
  emptyText: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
});
