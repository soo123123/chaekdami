import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, keepAllWords, spacing } from '../../constants/theme';
import { BookCover } from '../common/BookCover';
import { TagList } from '../common/Tag';

type BookInfoProps = {
  book: { title: string; author: string; coverImageUrl?: string; categories?: string[] };
  coverWidth?: number;
  /** 제목 영역 아래 추가 정보 (평점, 페이지 수, 시작일 등) */
  children?: ReactNode;
  /** 제목 크기 (기본 24) */
  titleSize?: number;
  /** 표지 높이 (기본: 너비의 1.45배) */
  coverHeight?: number;
  /** 분류 태그 표시 여부 */
  showTags?: boolean;
};

/** 책 기본 정보 표시 (표지 + 제목/저자/분류) */
export function BookInfo({ book, coverWidth = 110, children, titleSize = 24, coverHeight, showTags = true }: BookInfoProps) {
  return (
    <View style={styles.row}>
      <View style={styles.coverShadow}>
        <BookCover uri={book.coverImageUrl} title={book.title} author={book.author} width={coverWidth} height={coverHeight} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, { fontSize: titleSize }]} numberOfLines={3} accessibilityRole="header">{book.title}</Text>
        <Text style={styles.author} numberOfLines={2}>{book.author}</Text>
        {showTags ? <TagList tags={book.categories} /> : null}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md + 4, alignItems: 'flex-start' },
  coverShadow: { borderRadius: 6, shadowColor: '#5A3E28', shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  info: { flex: 1, gap: spacing.sm + 2, paddingTop: spacing.sm },
  title: { fontWeight: '800', color: colors.text, letterSpacing: -0.5, ...keepAllWords },
  author: { fontSize: 17, color: colors.secondaryText },
});
