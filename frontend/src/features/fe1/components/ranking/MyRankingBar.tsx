import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import type { MyRanking, RankingEntry, RankingType } from '../../types/ranking';
import { RANKING_IMAGES } from './rankingImages';
import { formatRankingScore } from './RankingListItem';

type Props = { mine: MyRanking; rankings: RankingEntry[]; type: RankingType };

/**
 * 내 순위가 공동 순위인지 (ASK-16).
 * - 목록에 같은 순위의 다른 사람이 있으면 공동이다.
 * - 목록 마지막 순위 이내인데 목록에 내가 없으면, 30명에서 잘린 동점이다.
 * 30명 밖의 동점은 서버가 알려주지 않아 알 수 없다.
 */
export function isTiedRank(mine: MyRanking, rankings: RankingEntry[]): boolean {
  if (mine.rank === null) return false;
  if (rankings.some(entry => !entry.me && entry.rank === mine.rank)) return true;
  const last = rankings[rankings.length - 1];
  return !!last && mine.rank <= last.rank && !rankings.some(entry => entry.me);
}

/**
 * 순위가 없는 이유 (ASK-20).
 * 서버는 이유를 따로 주지 않는다. 점수가 0이면 이번 주 기록이 없는 것이고,
 * 점수가 있는데 순위가 없으면 집계 제외 대상(관리자·정지 회원)으로 본다.
 * 서버가 다른 제외 기준을 추가하면 이 추론을 다시 확인해야 한다.
 */
export function noRankMessage(mine: MyRanking): string {
  return mine.score > 0 ? '집계 대상이 아니에요' : '이번 주 기록이 없어요';
}

/** 목록 아래에 고정되는 내 순위 */
export function MyRankingBar({ mine, rankings, type }: Props) {
  const hasRank = mine.rank !== null;
  const tied = isTiedRank(mine, rankings);
  const rankLabel = hasRank ? `${tied ? '공동 ' : ''}${mine.rank}위` : null;
  const score = hasRank ? formatRankingScore(type, mine.score) : noRankMessage(mine);
  return (
    <View
      accessible
      accessibilityLabel={`내 순위 ${rankLabel ? `${rankLabel}, ` : '순위 없음, '}${mine.nickname}, 레벨 ${mine.level}, ${score}`}
      style={styles.bar}
    >
      <View style={styles.rankBox}>
        {tied ? <Text style={styles.tied}>공동</Text> : null}
        <Text style={styles.rank} numberOfLines={1} adjustsFontSizeToFit>{hasRank ? `${mine.rank}위` : '–'}</Text>
      </View>
      <Image source={RANKING_IMAGES.profile} style={styles.avatar} contentFit="cover" />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{mine.nickname}</Text>
        <Text style={styles.sub}>내 순위 · Lv. {mine.level}</Text>
      </View>
      <Text style={[styles.score, !hasRank && styles.noRank]} numberOfLines={1}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.primary },
  rankBox: { width: 48, alignItems: 'center' },
  tied: { fontSize: 11, fontWeight: '600', color: colors.primarySoft },
  rank: { fontSize: 17, fontWeight: '700', color: colors.onPrimary, textAlign: 'center' },
  avatar: { width: 42, height: 42 },
  info: { flex: 1, minWidth: 0, gap: spacing.xxs },
  name: { fontSize: 15, fontWeight: '700', color: colors.onPrimary },
  sub: { fontSize: 12, color: colors.primarySoft },
  score: { flexShrink: 0, fontSize: 15, fontWeight: '700', color: colors.onPrimary },
  noRank: { fontSize: 13, fontWeight: '600' },
});
