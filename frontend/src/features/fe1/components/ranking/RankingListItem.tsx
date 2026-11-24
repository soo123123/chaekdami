import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import type { RankingEntry, RankingType } from '../../types/ranking';
import { formatDuration } from '../../utils/format';
import { medalFor, RANKING_IMAGES } from './rankingImages';

type Props = { entry: RankingEntry; type: RankingType };

/** 랭킹 점수: 독서 시간(초) → 6시간 15분, 경험치 → 1,240 EXP */
export function formatRankingScore(type: RankingType, score: number): string {
  if (type === 'readingTime') return formatDuration(score);
  return `${String(score).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} EXP`;
}

/** 순위 한 줄 */
export function RankingListItem({ entry, type }: Props) {
  const medal = medalFor(entry.rank);
  const score = formatRankingScore(type, entry.score);
  return (
    <View
      accessible
      accessibilityLabel={`${entry.rank}위 ${entry.nickname}${entry.me ? ' 나' : ''}, 레벨 ${entry.level}, ${score}`}
      style={[styles.row, entry.me && styles.me]}
    >
      <View style={styles.rank}>
        {medal ? <Image source={medal} style={styles.medal} contentFit="contain" /> : <Text style={styles.rankText}>{entry.rank}</Text>}
      </View>
      <Image source={RANKING_IMAGES.profile} style={styles.avatar} contentFit="cover" />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{entry.nickname}</Text>
          {entry.me ? <Text style={styles.badge}>나</Text> : null}
        </View>
        <Text style={styles.level}>{medal ? `${entry.rank}위 · ` : ''}Lv. {entry.level}</Text>
      </View>
      <Text style={styles.score}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2, paddingHorizontal: spacing.md - 2, paddingVertical: spacing.sm, backgroundColor: colors.surface },
  me: { backgroundColor: colors.primarySoft },
  rank: { width: 40, alignItems: 'center' },
  rankText: { fontSize: 16, fontWeight: '700', color: colors.secondaryText },
  medal: { width: 48, height: 48 },
  avatar: { width: 42, height: 42 },
  info: { flex: 1, minWidth: 0, gap: spacing.xxs },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { flexShrink: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  badge: { fontSize: 11, fontWeight: '600', color: colors.primary, backgroundColor: colors.onPrimary, borderWidth: 1, borderColor: colors.primaryBorder, borderRadius: radius.pill, overflow: 'hidden', paddingHorizontal: 6 },
  level: { fontSize: 12, color: colors.secondaryText },
  score: { fontSize: 15, fontWeight: '700', color: colors.primary },
});
