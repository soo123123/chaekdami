import { StyleSheet, Text, View } from 'react-native';
import { colors, keepAllWords, radius, spacing } from '../../constants/theme';
import { formatDateWithWeekday, formatDuration } from '../../utils/format';
import { BookCover } from '../common/BookCover';
import { Card } from '../common/Card';
import { Icon } from '../common/Icon';

export type ReadingResultData = {
  title: string;
  author: string;
  coverImageUrl?: string;
  /** yyyy-MM-dd */
  date: string;
  /** 초 단위 */
  readingTime: number;
  /** 이번 기록으로 책을 다 읽었는지 */
  isFinished: boolean;
};

/** 종료된 독서 결과 요약 */
export function ReadingResult({ result }: { result: ReadingResultData }) {
  return (
    <Card>
      <View style={styles.row}>
        <BookCover uri={result.coverImageUrl} title={result.title} author={result.author} width={84} height={116} />
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>{result.title}</Text>
            {result.isFinished ? (
              <View style={styles.badgeRow}>
                <View style={styles.badge}><Text style={styles.badgeLabel}>독서 완료</Text></View>
                <Icon name="chevronRight" size={18} color={colors.secondaryText} />
              </View>
            ) : null}
          </View>
          <Text style={styles.author} numberOfLines={1}>{result.author}</Text>
          <View style={styles.metaRow}>
            <Icon name="calendar" size={18} color={colors.secondaryText} />
            <Text style={styles.meta}>{formatDateWithWeekday(result.date)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Icon name="clock" size={18} color={colors.secondaryText} />
            <Text style={styles.meta}>{`독서 시간 ${formatDuration(result.readingTime)}`}</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md + 2 },
  info: { flex: 1, gap: spacing.xs + 2 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  title: { flex: 1, fontSize: 20, fontWeight: '800', color: colors.text, ...keepAllWords },
  author: { fontSize: 15, color: colors.secondaryText, marginBottom: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  meta: { fontSize: 15, color: colors.secondaryText },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  badge: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm + 4, paddingVertical: 5 },
  badgeLabel: { fontSize: 13, color: colors.primary, fontWeight: '700' },
});
