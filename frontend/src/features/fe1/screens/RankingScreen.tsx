import { Image } from 'expo-image';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { BottomTabBar } from '@/components/BottomTabBar';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { ErrorView, LoadingView } from '../components/common/StateView';
import { MyRankingBar } from '../components/ranking/MyRankingBar';
import { RankingListItem } from '../components/ranking/RankingListItem';
import { RankingTabs } from '../components/ranking/RankingTabs';
import { RANKING_IMAGES } from '../components/ranking/rankingImages';
import { colors, radius, spacing } from '../constants/theme';
import { useWeeklyRanking } from '../hooks/ranking/useWeeklyRanking';
import { formatDateWithWeekday } from '../utils/format';

/** yyyy-MM-dd → 11.23 (월) */
const formatMonthDay = (value: string) => formatDateWithWeekday(value).replace(/^\d{4}\./, '');

/** 주간 랭킹 화면 (스펙 008). 순위 계산은 서버가 하고, 화면은 받은 순서와 순위를 그대로 보여준다. */
export function RankingScreen() {
  const { type, setType, ranking, error, isPastWeek, isRefreshing, refresh, reload } = useWeeklyRanking('readingTime');
  const refreshControl = <RefreshControl refreshing={isRefreshing} onRefresh={() => void refresh()} tintColor={colors.primary} colors={[colors.primary]} />;

  const renderBody = () => {
    if (error) return <ErrorView error={error} onRetry={() => void reload()} />;
    if (!ranking) return <LoadingView message="순위를 불러오는 중이에요…" />;
    if (ranking.rankings.length === 0) {
      return (
        <View style={styles.empty}>
          {/* 월요일 0시 직후처럼 아직 아무도 읽지 않은 주 (TODO-30) */}
          <Image source={RANKING_IMAGES.empty} style={styles.emptyImage} contentFit="contain" accessible={false} />
          <Text style={styles.emptyTitle}>아직 이번 주 기록이 없어요</Text>
          <Text style={styles.emptyMessage}>이번 주 첫 기록을 남겨 보세요.{'\n'}책을 읽으면 순위에 이름이 올라가요.</Text>
        </View>
      );
    }
    return (
      <FlatList
        key={type}
        data={ranking.rankings}
        keyExtractor={(item, index) => `${index}-${item.nickname}`}
        renderItem={({ item }) => <RankingListItem entry={item} type={type} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      />
    );
  };

  return (
    <View style={styles.flex}>
      <ScreenContainer scrollable={false}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text accessibilityRole="header" style={styles.title}>랭킹</Text>
            <Text style={styles.period}>
              {isPastWeek ? '지난주' : '이번 주'}{ranking ? `\n${formatMonthDay(ranking.weekStartDate)} – ${formatMonthDay(ranking.weekEndDate)}` : '\n'}
            </Text>
          </View>
          <Image source={RANKING_IMAGES.hero} style={styles.hero} contentFit="contain" accessible={false} />
        </View>
        <RankingTabs selected={type} onChange={setType} />
        {isPastWeek ? (
          // 주가 바뀐 뒤 다시 조회가 실패해 지난주 순위가 남은 경우 (TODO-44)
          <Pressable accessibilityRole="button" onPress={() => void reload()} style={styles.pastWeek}>
            <Text style={styles.pastWeekText}>지난주 순위예요 · 다시 불러오기</Text>
          </Pressable>
        ) : null}
        <View style={styles.list}>{renderBody()}</View>
      </ScreenContainer>
      {ranking ? <MyRankingBar mine={ranking.myRanking} rankings={ranking.rankings} type={type} /> : null}
      <BottomTabBar active="ranking" />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingTop: spacing.md, marginBottom: -spacing.sm },
  headerText: { flexGrow: 1, flexShrink: 0, gap: spacing.xs, paddingBottom: spacing.md },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  period: { fontSize: 14, lineHeight: 19, color: colors.secondaryText },
  hero: { flexShrink: 1, width: 180, height: 90 },
  list: { flex: 1, marginBottom: -spacing.lg, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderBottomWidth: 0, borderColor: colors.border, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card },
  pastWeek: { marginBottom: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.card, backgroundColor: colors.primarySoft },
  pastWeekText: { fontSize: 13, fontWeight: '600', color: colors.primary, textAlign: 'center' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg },
  emptyImage: { width: 190, height: 190 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  emptyMessage: { fontSize: 14, lineHeight: 20, color: colors.secondaryText, textAlign: 'center' },
});
