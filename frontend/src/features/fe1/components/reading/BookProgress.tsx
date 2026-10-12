import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import { calcProgress } from '../../utils/format';
import { Card } from '../common/Card';
import { ReadingProgress } from './ReadingProgress';

type BookProgressProps = { currentPage: number; totalPages?: number };

/** 책 상세의 독서 진행률 카드 */
export function BookProgress({ currentPage, totalPages }: BookProgressProps) {
  const percent = calcProgress(currentPage, totalPages);
  const remaining = totalPages ? Math.max(0, totalPages - currentPage) : null;
  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>독서 진행률</Text>
          <Text style={styles.percent}>{percent === null ? '-' : `${percent}%`}</Text>
          <Text style={styles.sub}>{`${currentPage} / ${totalPages ?? '-'}쪽`}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.col}>
          <Text style={styles.label}>현재 읽은 페이지</Text>
          <Text style={styles.page}>
            {`${currentPage}쪽`}
            <Text style={styles.pageTotal}>{totalPages ? `  / ${totalPages}쪽` : ''}</Text>
          </Text>
        </View>
      </View>
      <ReadingProgress currentPage={currentPage} totalPages={totalPages} showLabels={false} showCaption={false} height={10} />
      {remaining !== null ? <Text style={styles.sub}>{`남은 페이지 ${remaining}쪽`}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1, gap: spacing.xs },
  divider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  label: { fontSize: 14, color: colors.text },
  percent: { fontSize: 30, fontWeight: '800', color: colors.primary },
  page: { fontSize: 26, fontWeight: '800', color: colors.text },
  pageTotal: { fontSize: 16, fontWeight: '400', color: colors.secondaryText },
  sub: { fontSize: 14, color: colors.secondaryText },
});
