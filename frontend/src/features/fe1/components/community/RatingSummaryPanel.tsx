import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import type { RatingKey, RatingSummary } from '../../types/community';
import { Icon } from '../common/Icon';
import { StarRating } from './StarRating';

const ROWS: RatingKey[] = ['5', '4', '3', '2', '1'];

type Props = { summary: RatingSummary | null; isLoading: boolean; hasError: boolean };

/** 평균 별점 + 평가 인원 + 1~5점 분포 막대 */
export function RatingSummaryPanel({ summary, isLoading, hasError }: Props) {
  if (!summary) {
    return (
      <View style={styles.placeholder}>
        {isLoading ? <ActivityIndicator color={colors.primary} /> : null}
        <Text style={styles.placeholderText}>{hasError ? '별점 정보를 불러오지 못했어요.' : '별점 정보를 불러오는 중이에요…'}</Text>
      </View>
    );
  }
  const max = Math.max(1, ...ROWS.map(key => summary.distribution[key] ?? 0));
  return (
    <View style={styles.row}>
      <View style={styles.average}>
        <View style={styles.averageLine}>
          <Icon name="star" size={26} color={colors.star} />
          <Text style={styles.averageValue}>{summary.averageRating.toFixed(1)}</Text>
          <Text style={styles.averageMax}>/ 5.0</Text>
        </View>
        <Text style={styles.count}>
          {summary.ratingCount > 0 ? `${summary.ratingCount.toLocaleString()}명이 평가했어요` : '아직 평가가 없어요'}
        </Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.bars} accessibilityLabel="별점 분포">
        {ROWS.map(key => {
          const value = summary.distribution[key] ?? 0;
          return (
            <View key={key} style={styles.barRow} accessibilityLabel={`${key}점 ${value}명`}>
              <StarRating value={Number(key)} size={9} gap={1} />
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${(value / max) * 100}%` }]} />
              </View>
              <Text style={styles.barCount}>{value.toLocaleString()}명</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  average: { alignItems: 'center', gap: spacing.xs, minWidth: 84 },
  averageLine: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  averageValue: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  averageMax: { fontSize: 14, color: colors.secondaryText },
  count: { fontSize: 12, color: colors.secondaryText },
  divider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: colors.borderStrong },
  bars: { flex: 1, gap: 5 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  track: { flex: 1, height: 6, borderRadius: radius.pill, backgroundColor: colors.progressTrack, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.primaryLight },
  barCount: { minWidth: 36, fontSize: 11, color: colors.secondaryText, textAlign: 'right' },
  placeholder: { minHeight: 96, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  placeholderText: { fontSize: 13, color: colors.secondaryText },
});
