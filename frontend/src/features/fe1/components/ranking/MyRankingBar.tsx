import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import type { MyRanking, RankingType } from '../../types/ranking';
import { RANKING_IMAGES } from './rankingImages';
import { formatRankingScore } from './RankingListItem';

type Props = { mine: MyRanking; type: RankingType };

/** 목록 아래에 고정되는 내 순위 */
export function MyRankingBar({ mine, type }: Props) {
  const hasRank = mine.rank !== null;
  const score = hasRank ? formatRankingScore(type, mine.score) : '순위 없음';
  return (
    <View
      accessible
      accessibilityLabel={`내 순위 ${hasRank ? `${mine.rank}위, ` : ''}${mine.nickname}, 레벨 ${mine.level}, ${score}`}
      style={styles.bar}
    >
      <Text style={styles.rank} numberOfLines={1} adjustsFontSizeToFit>{hasRank ? `${mine.rank}위` : '–'}</Text>
      <Image source={RANKING_IMAGES.profile} style={styles.avatar} contentFit="cover" />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{mine.nickname}</Text>
        <Text style={styles.sub}>내 순위 · Lv. {mine.level}</Text>
      </View>
      <Text style={styles.score}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.primary },
  rank: { width: 48, fontSize: 17, fontWeight: '700', color: colors.onPrimary, textAlign: 'center' },
  avatar: { width: 42, height: 42 },
  info: { flex: 1, minWidth: 0, gap: spacing.xxs },
  name: { fontSize: 15, fontWeight: '700', color: colors.onPrimary },
  sub: { fontSize: 12, color: colors.primarySoft },
  score: { fontSize: 15, fontWeight: '700', color: colors.onPrimary },
});
