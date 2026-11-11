import { StyleSheet, Text, View } from 'react-native';
import { colors, keepAllWords, radius, softShadow, spacing } from '../../constants/theme';
import type { RatingSummary } from '../../types/community';
import type { RegisteredBook } from '../../types/reading';
import { BookCover } from '../common/BookCover';
import { TagList } from '../common/Tag';
import { RatingSummaryPanel } from './RatingSummaryPanel';

type Props = {
  book: RegisteredBook;
  summary: RatingSummary | null;
  isSummaryLoading: boolean;
  hasSummaryError: boolean;
};

/** 선택한 완독 도서 정보 + 별점 통계 */
export function CommunityBookCard({ book, summary, isSummaryLoading, hasSummaryError }: Props) {
  return (
    <View style={styles.card}>
      <BookCover uri={book.coverImageUrl} title={book.title} author={book.author} width={76} />
      <View style={styles.body}>
        <Text accessibilityRole="header" style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>{book.author}</Text>
        <TagList tags={book.categories} />
        <View style={styles.line} />
        <RatingSummaryPanel summary={summary} isLoading={isSummaryLoading} hasError={hasSummaryError} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(236, 227, 216, 0.6)', ...softShadow },
  body: { flex: 1, gap: spacing.xs + 2 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.3, ...keepAllWords },
  author: { fontSize: 14, color: colors.secondaryText, marginBottom: 2 },
  line: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong, marginVertical: spacing.xs },
});
