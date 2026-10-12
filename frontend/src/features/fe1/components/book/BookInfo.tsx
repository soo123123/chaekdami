import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import { BookCover } from '../common/BookCover';
import { TagList } from '../common/Tag';

type BookInfoProps = {
  book: { title: string; author: string; coverImageUrl?: string; categories?: string[] };
  coverWidth?: number;
  /** 제목 영역 아래 추가 정보 (평점, 페이지 수, 시작일 등) */
  children?: ReactNode;
};

/** 책 기본 정보 표시 (표지 + 제목/저자/분류) */
export function BookInfo({ book, coverWidth = 110, children }: BookInfoProps) {
  return (
    <View style={styles.row}>
      <BookCover uri={book.coverImageUrl} title={book.title} width={coverWidth} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={3} accessibilityRole="header">{book.title}</Text>
        <Text style={styles.author} numberOfLines={2}>{book.author}</Text>
        <TagList tags={book.categories} />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  info: { flex: 1, gap: spacing.sm, paddingTop: spacing.xs },
  title: { fontSize: 21, fontWeight: '800', color: colors.text },
  author: { fontSize: 16, color: colors.secondaryText },
});
