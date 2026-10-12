import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import type { LibraryTheme, RegisteredBook } from '../../types/reading';
import { calcProgress } from '../../utils/format';
import { BookCover } from '../common/BookCover';

const COVER_WIDTH = 82;

type BookShelfSectionProps = {
  title: string;
  books: RegisteredBook[];
  theme: LibraryTheme;
  onBookPress: (bookId: number) => void;
  /** 책 추가하기 칸 표시 */
  onAddBook?: () => void;
  onTitlePress?: () => void;
};

/** 독서 상태별 책장 한 칸 */
export function BookShelfSection({ title, books, theme, onBookPress, onAddBook, onTitlePress }: BookShelfSectionProps) {
  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title} ${books.length}권만 보기`}
        disabled={!onTitlePress}
        onPress={onTitlePress}
        style={styles.label}
      >
        <Text style={styles.labelText}>{`${title} ${books.length}  ›`}</Text>
      </Pressable>
      <View style={[styles.shelf, { backgroundColor: theme.palette.shelf }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {books.map(book => (
            <ShelfBook key={book.bookId} book={book} onPress={onBookPress} />
          ))}
          {onAddBook ? <AddBookButton onPress={onAddBook} /> : null}
          {books.length === 0 && !onAddBook ? (
            <View style={styles.emptySlot}><Text style={styles.emptyText}>아직 책이 없어요</Text></View>
          ) : null}
        </ScrollView>
        <View style={[styles.board, { backgroundColor: theme.palette.shelfEdge }]} />
      </View>
    </View>
  );
}

/** 책장 위 책 한 권 (BookCard + BookProgress) */
function ShelfBook({ book, onPress }: { book: RegisteredBook; onPress: (bookId: number) => void }) {
  const percent = calcProgress(book.currentPage, book.totalPages);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${book.title}, ${percent === null ? '진행률 정보 없음' : `${percent}% 읽음`}`}
      onPress={() => onPress(book.bookId)}
      style={styles.book}
    >
      <BookCover uri={book.coverImageUrl} title={book.title} width={COVER_WIDTH} />
      <View style={styles.progressOverlay}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${percent ?? 0}%` }]} />
        </View>
        <Text style={styles.percent}>{percent === null ? '-' : `${percent}%`}</Text>
      </View>
    </Pressable>
  );
}

export function AddBookButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="책 추가하기" onPress={onPress} style={styles.add}>
      <View style={styles.addCircle}><Text style={styles.addPlus}>+</Text></View>
      <Text style={styles.addLabel}>책 추가하기</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.xs },
  label: { alignSelf: 'flex-start', backgroundColor: '#FBE3C1', borderRadius: radius.input, paddingHorizontal: spacing.sm + 4, paddingVertical: spacing.xs + 2, marginLeft: spacing.xs },
  labelText: { fontSize: 15, fontWeight: '700', color: colors.text },
  shelf: { borderRadius: radius.cover, paddingTop: spacing.sm + 4, overflow: 'hidden' },
  row: { gap: spacing.sm + 2, paddingHorizontal: spacing.sm + 4, paddingBottom: spacing.sm, minHeight: COVER_WIDTH * 1.45 + spacing.sm },
  board: { height: 10 },
  book: { width: COVER_WIDTH, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  progressOverlay: { position: 'absolute', left: 6, right: 6, bottom: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  track: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.45)', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#FFFFFF' },
  percent: { fontSize: 10, color: '#FFFFFF', fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 2 },
  add: { width: COVER_WIDTH, height: COVER_WIDTH * 1.45, borderRadius: radius.cover, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(0,0,0,0.12)', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  addCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.75)', alignItems: 'center', justifyContent: 'center' },
  addPlus: { fontSize: 20, color: colors.shelfWoodDark, lineHeight: 22 },
  addLabel: { fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
  emptySlot: { height: COVER_WIDTH * 1.45, justifyContent: 'center', paddingHorizontal: spacing.md },
  emptyText: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
});
