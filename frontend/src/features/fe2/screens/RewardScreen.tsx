
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ROUTES } from '@/constants/routes';
import { goBackOr } from '@/utils/navigation';
import { HIT_SLOP } from '@/constants/layout';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getDday } from '../api/ddayApi';
import { getReadingStats } from '../api/readingStatsApi';
import { formatBuffEndTime, getRewardStatus } from '../api/rewardApi';
import { Icon } from '@/components/common/Icon';
import { LoadFailedView } from '../components/LoadFailedView';

type RewardStatus = {
  level?: number;
  xp?: number;
  requiredXp?: number;
  currency?: number;
  dday?: number;
  expBuffActive?: boolean;
  expBuffExpiredAt?: string | null;
};

function formatReadingTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}분`;
  if (minutes === 0) return `${hours}시간`;
  return `${hours}시간 ${minutes}분`;
}

const COLORS = {
  background: '#FBF7F2',
  white: '#FFFDFC',
  green: '#365F49',
  darkGreen: '#284F3B',
  paleGreen: '#EFF4EC',
  cream: '#F7F0E8',
  text: '#201E1B',
  muted: '#77736F',
  border: '#EEE8E1',
};

const ART = {
  catBooks: require('../../../../assets/images/level/level-cat-books.png'),
  readingCat: require('../../../../assets/images/level/level-reading-cat.png'),
  sproutBadge: require('../../../../assets/images/level/level-sprout-badge.png'),
  book: require('../../../../assets/images/level/level-open-book.png'),
  clock: require('../../../../assets/images/level/level-clock.png'),
  calendar: require('../../../../assets/images/level/level-calendar.png'),
};

function StatItem({
  image,
  label,
  value,
}: {
  image: any;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statItem}>
      <View style={styles.statIconCircle}>
        <Image
          source={image}
          style={styles.statIcon}
          resizeMode="contain"
        />
      </View>

      <View style={styles.statTextArea}>
        <Text style={styles.statLabel} numberOfLines={1}>
          {label}
        </Text>

        <Text
          style={styles.statValue}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function RewardScreen() {
  const [reward, setReward] =
    useState<RewardStatus | null>(null);
  // 조회하지 못한 값은 null
  const [activity, setActivity] = useState<{
    completedBooks: number | null;
    totalMinutes: number | null;
    streak: number | null;
  }>({
    completedBooks: null,
    totalMinutes: null,
    streak: null,
  });
  const [loading, setLoading] = useState(true);

  const loadReward = useCallback(() => {
    let active = true;

    async function load() {
      const [rewardResult, statsResult, ddayResult] = await Promise.allSettled([
        getRewardStatus(),
        getReadingStats(),
        getDday(),
      ]);

      if (!active) return;

      if (rewardResult.status === 'fulfilled') {
        setReward(rewardResult.value);
      } else {
        console.warn('레벨 정보 조회 실패:', rewardResult.reason);
        // 이미 받은 값이 있으면 그대로 둔다
      }

      setActivity((previous) => ({
        completedBooks: statsResult.status === 'fulfilled'
          ? statsResult.value.completedBooks
          : previous.completedBooks,
        totalMinutes: statsResult.status === 'fulfilled'
          ? statsResult.value.totalMinutes
          : previous.totalMinutes,
        // 서버가 계산한 연속 일수 (D-day 조회 실패 시 보상 상태 값)
        streak: ddayResult.status === 'fulfilled'
          ? ddayResult.value.currentStreak ?? 0
          : rewardResult.status === 'fulfilled'
            ? rewardResult.value.dday
            : previous.streak,
      }));

      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(loadReward);

  const goBack = () => goBackOr(ROUTES.fe2.mypage);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color={COLORS.green}
        />

        <Text style={styles.loadingText}>
          레벨 정보를 불러오는 중...
        </Text>
      </View>
    );
  }

  if (!reward) {
    return (
      <LoadFailedView
        title="레벨"
        message="레벨 정보를 불러오지 못했어요."
        onRetry={() => {
          setLoading(true);
          loadReward();
        }}
        onBack={goBack}
      />
    );
  }

  const level = Math.max(1, reward.level ?? 1);
  const xp = Math.max(0, reward.xp ?? 0);
  const requiredXp = Math.max(
    1,
    reward.requiredXp ?? 1
  );

  const remainingXp = Math.max(0, requiredXp - xp);
  const buffEndTime = reward.expBuffActive
    ? formatBuffEndTime(reward.expBuffExpiredAt)
    : null;

  const progress = Math.min(
    100,
    (xp / requiredXp) * 100
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={goBack}
            style={styles.backButton}
            hitSlop={HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
          >
            <Ionicons
              name="chevron-back"
              size={29}
              color={COLORS.text}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            레벨
          </Text>

          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => router.push('/fe2/reward/quest')}
            accessibilityRole="button"
            accessibilityLabel="오늘의 퀘스트 보기"
          >
            <MaterialCommunityIcons
              name="clipboard-check-outline"
              size={27}
              color={COLORS.text}
            />
          </TouchableOpacity>
        </View>

        {/* 상단 레벨 카드 */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroLeft}>
              <Image
                source={ART.sproutBadge}
                style={styles.heroBadge}
                resizeMode="contain"
              />

              <View style={styles.heroLevelText}>
                <Text style={styles.heroLabel}>
                  현재 레벨
                </Text>

                <Text style={styles.heroLevel}>
                  Lv. {level}
                </Text>
              </View>
            </View>

            <Image
              source={ART.catBooks}
              style={styles.heroCat}
              resizeMode="contain"
            />
          </View>

          <View style={styles.heroProgress}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress}%` },
                ]}
              />
            </View>

            <Text style={styles.xpText}>
              {xp.toLocaleString()} /{' '}
              {requiredXp.toLocaleString()} exp
            </Text>

            <Text style={styles.remainingText}>
              다음 레벨까지{' '}
              {remainingXp.toLocaleString()} exp
              남았어요!
            </Text>
            {buffEndTime ? (
              <Text style={styles.boosterText}>
                EXP 부스터 적용 중 (~{buffEndTime})
              </Text>
            ) : null}
          </View>
        </View>

        {/* 독서 활동 요약 */}
        <View style={styles.statsCard}>
          <StatItem
            image={ART.book}
            label="읽은 책"
            value={activity.completedBooks === null ? '-' : `${activity.completedBooks}권`}
          />

          <View style={styles.statDivider} />

          <StatItem
            image={ART.clock}
            label="독서 시간"
            value={activity.totalMinutes === null ? '-' : formatReadingTime(activity.totalMinutes)}
          />

          <View style={styles.statDivider} />

          <StatItem
            image={ART.calendar}
            label="연속 독서"
            value={activity.streak === null ? '-' : `${activity.streak}일`}
          />
        </View>

        {/* 레벨표·혜택은 서버 값이 없어 보여주지 않는다 (ISSUE-BUG-16) */}
        <View style={styles.mainPanel}>
          {/* 하단 응원 카드 */}
          <View style={styles.cheerCard}>
            <Image
              source={ART.readingCat}
              style={styles.cheerCat}
              resizeMode="contain"
            />

            <View style={styles.cheerInformation}>
              <Text style={styles.cheerTitle}>
                조금만 더 힘내요!
              </Text>

              <Text style={styles.cheerDescription}>
                다음 레벨까지{' '}
                {remainingXp.toLocaleString()} exp
                남았어요.
                {'\n'}
                오늘도 꾸준한 독서로 더 성장해보세요!
              </Text>

              {/* 금액은 서버가 승급 보상 값을 주면 표시한다 (TODO-49) */}
              <Text style={styles.cheerReward}>
                레벨이 오르면 재화를 받아요.
              </Text>
            </View>
          </View>
        </View>

        {/* 재화 상점 이동 버튼 */}
        <TouchableOpacity
          style={styles.shopButton}
          onPress={() => router.push('/fe2/reward/shop')}
        >
          <Ionicons
            name="cart-outline"
            size={20}
            color={COLORS.green}
          />

          <Text style={styles.shopButtonText}>
            재화 상점 가기
          </Text>

          <Icon
            name="chevronRight"
            size={16}
            color={COLORS.green}
          />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingTop: 21,
    paddingBottom: 40,
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },

  loadingText: {
    marginTop: 12,
    color: COLORS.muted,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    minHeight: 44,
  },

  backButton: {
    width: 40,
    height: 44,
    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,
    fontSize: 25,
    fontWeight: '900',
    color: COLORS.text,
  },

  helpButton: {
    width: 35,
    alignItems: 'flex-end',
  },

  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 17,
    paddingTop: 22,
    paddingBottom: 21,
    marginBottom: 15,
    overflow: 'hidden',
  },

  heroTop: {
    minHeight: 176,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  heroLeft: {
    width: '60%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    zIndex: 2,
  },

  heroBadge: {
    width: 63,
    height: 63,
    marginTop: 5,
    marginRight: 8,
  },

  heroLevelText: {
    flex: 1,
    paddingTop: 8,
  },

  heroLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.green,
  },

  heroLevel: {
    fontSize: 37,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 9,
  },

  heroCat: {
    position: 'absolute',
    width: 175,
    height: 166,
    right: -14,
    top: 3,
  },

  heroProgress: {
    marginTop: 5,
  },

  progressTrack: {
    width: '100%',
    height: 11,
    borderRadius: 10,
    backgroundColor: '#E7E6E3',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: COLORS.green,
    borderRadius: 10,
  },

  xpText: {
    fontSize: 14,
    color: '#66645F',
    marginTop: 12,
  },

  remainingText: {
    fontSize: 13,
    color: '#66645F',
    marginTop: 8,
    lineHeight: 20,
  },
  boosterText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.green,
  },

  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 19,
    marginBottom: 16,
  },

  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },

  statIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },

  statIcon: {
    width: 28,
    height: 28,
  },

  statTextArea: {
    flex: 1,
    minWidth: 0,
  },

  statLabel: {
    color: COLORS.muted,
    fontSize: 9,
    marginBottom: 4,
  },

  statValue: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '900',
  },

  statDivider: {
    width: 1,
    height: 43,
    backgroundColor: COLORS.border,
    marginHorizontal: 3,
  },

  mainPanel: {
    backgroundColor: COLORS.white,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
    paddingTop: 21,
    paddingBottom: 17,
  },

  // 하단 응원 카드
  cheerCard: {
    backgroundColor: COLORS.cream,
    borderRadius: 20,
    minHeight: 153,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },

  // 왼쪽에서 잘리던 이미지를 오른쪽으로 이동
  cheerCat: {
    width: 142,
    height: 145,
    marginLeft: 0,
  },

  // 글을 카드의 세로 중앙으로 정렬
  cheerInformation: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: 5,
    paddingRight: 12,
  },

  cheerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 10,
  },

  cheerDescription: {
    fontSize: 11,
    lineHeight: 19,
    color: COLORS.muted,
  },

  cheerReward: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.green,
  },

  shopButton: {
    marginTop: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.green,
    borderRadius: 15,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  shopButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.green,
  },
});
