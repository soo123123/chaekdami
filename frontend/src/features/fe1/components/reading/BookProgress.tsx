import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import { calcProgress } from '../../utils/format';
import { Card } from '../common/Card';
import { ReadingProgress } from './ReadingProgress';

type BookProgressProps = {
  currentPage: number;
  totalPages?: number;
  /** card: 책 상세 진행률 카드 / overlay: 서재 책 표지 위 진행 막대 */
  variant?: 'card' | 'overlay';
};

/** 책의 독서 진행 상태 표시 */
export function BookProgress({ currentPage, totalPages, variant = 'card' }: BookProgressProps) {
  const percent = calcProgress(currentPage, totalPages);
  if (variant === 'overlay') {
    return (
      <View style={styles.overlay}>
        <View style={styles.overlayTrack}>
          <View style={[styles.overlayFill, { width: `${percent ?? 0}%` }, percent === 100 && styles.overlayDone]} />
        </View>
        <Text style={styles.overlayPercent}>{percent === null ? '-' : `${percent}%`}</Text>
      </View>
    );
  }
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
  divider: { width: 1, backgroundColor: colors.border, marginBottom: spacing.lg },
  label: { fontSize: 15, color: colors.text },
  percent: { fontSize: 34, fontWeight: '800', color: colors.primary },
  page: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 4 },
  pageTotal: { fontSize: 16, fontWeight: '400', color: colors.secondaryText },
  sub: { fontSize: 15, color: colors.secondaryText },
  overlay: { position: 'absolute', left: 7, right: 7, bottom: 8, flexDirection: 'row', alignItems: 'center', gap: 5 },
  overlayTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)', overflow: 'hidden' },
  overlayFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 3 },
  overlayDone: { backgroundColor: '#9FE0B6' },
  overlayPercent: { fontSize: 11, color: '#FFFFFF', fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 3 },
});
