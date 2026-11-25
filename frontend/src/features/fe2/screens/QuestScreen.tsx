import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
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
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getQuests } from '../api/rewardApi';
import { Icon } from '@/components/common/Icon';
import { showToast } from '@/components/Toast';
import { LoadFailedView } from '../components/LoadFailedView';

type QuestType = 'DDAY' | 'WEEKLY';
type QuestTab = 'ALL' | QuestType;

interface Quest {
  id: number;
  title: string;
  description?: string;
  progress: number;
  target: number;
  rewardXp?: number;
  rewardCurrency?: number;
  completed?: boolean;
  type?: QuestType;
}

const COLORS = {
  background: '#F8F5F0',
  card: '#FFFDF9',
  cream: '#F3EDE2',
  green: '#3F5C49',
  darkGreen: '#294234',
  paleGreen: '#EAF0E8',
  border: '#EBE6DD',
  text: '#292824',
  secondary: '#827D73',
  gold: '#C89748',
  progress: '#DFE7DC',
};

const ART = {
  flag: require('../../../../assets/images/quest/quest-cat-flag.png'),
  sleeping: require('../../../../assets/images/quest/quest-cat-sleep-books.png'),
  reading: require('../../../../assets/images/quest/quest-cat-reading.png'),
  sitting: require('../../../../assets/images/quest/quest-cat-sitting.png'),
  stretching: require('../../../../assets/images/quest/quest-cat-stretch.png'),
  cushion: require('../../../../assets/images/quest/quest-cat-cushion.png'),
  calendar: require('../../../../assets/images/quest/quest-calendar-cat.png'),
  bookshelf: require('../../../../assets/images/quest/quest-bookshelf.png'),
  books: require('../../../../assets/images/quest/quest-books-flowers.png'),
  booksPlant: require('../../../../assets/images/quest/quest-books-plant.png'),
  openBook: require('../../../../assets/images/quest/quest-open-book.png'),
  flower: require('../../../../assets/images/quest/quest-flower-pot.png'),
  window: require('../../../../assets/images/quest/quest-window.png'),
};

function isCompleted(quest: Quest) {
  return Boolean(
    quest.completed ||
      (quest.target > 0 && quest.progress >= quest.target)
  );
}

function getProgress(quest: Quest) {
  if (quest.target <= 0) {
    return quest.completed ? 100 : 0;
  }

  return Math.min(
    100,
    Math.max(0, (quest.progress / quest.target) * 100)
  );
}

function ProgressBar({
  value,
  height = 8,
}: {
  value: number;
  height?: number;
}) {
  return (
    <View style={[styles.progressTrack, { height }]}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${Math.min(100, Math.max(0, value))}%`,
          },
        ]}
      />
    </View>
  );
}

function QuestIllustration({
  source,
  size = 78,
}: {
  source: any;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.questIllustrationBox,
        {
          width: size,
          height: size,
        },
      ]}
    >
      <Image
        source={source}
        style={styles.questIllustration}
        resizeMode="contain"
      />
    </View>
  );
}

function QuestCard({
  quest,
  image,
}: {
  quest: Quest;
  image: any;
}) {
  const completed = isCompleted(quest);

  return (
    <View style={styles.questCard}>
      <View style={styles.questCardHeader}>
        <QuestIllustration source={image} size={78} />

        <View style={styles.questCardText}>
          <View style={styles.questTitleRow}>
            <Text style={styles.questTitle}>
              {quest.title}
            </Text>

            {completed && (
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={COLORS.green}
              />
            )}
          </View>

          <Text style={styles.questDescription}>
            {quest.description ||
              '오늘도 독서 목표를 달성해 보세요.'}
          </Text>
        </View>
      </View>

      <View style={styles.progressLabelRow}>
        <Text style={styles.smallLabel}>진행 현황</Text>

        <Text style={styles.progressValue}>
          {quest.progress} / {quest.target}
        </Text>
      </View>

      <ProgressBar value={getProgress(quest)} />

      <View style={styles.questBottom}>
        <View style={styles.rewardBadges}>
          <View style={styles.xpBadge}>
            <Ionicons
              name="sparkles"
              size={12}
              color={COLORS.green}
            />

            <Text style={styles.xpBadgeText}>
              XP +{quest.rewardXp ?? 0}
            </Text>
          </View>

          <View style={styles.coinBadge}>
            <Icon name="coin" size={12} color={COLORS.gold} />
            <Text style={styles.coinBadgeText}>
              +{quest.rewardCurrency ?? 0}
            </Text>
          </View>
        </View>

        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {completed ? '달성 완료' : '진행 중'}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function QuestScreen() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [tab, setTab] = useState<QuestTab>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const loadedRef = useRef(false);

  const loadQuests = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await getQuests();

      if (!Array.isArray(response)) {
        throw new Error(
          '퀘스트 데이터 형식이 올바르지 않습니다.'
        );
      }

      setQuests(response.map((quest) => ({
        ...quest,
        // 현재 rewardApi의 EXP는 서버 WEEKLY 유형을 의미합니다.
        type: quest.type === 'EXP' ? 'WEEKLY' : quest.type,
      })) as Quest[]);
      loadedRef.current = true;
      setLoadFailed(false);
    } catch (error) {
      console.warn('퀘스트 조회 오류:', error);

      // 이미 받은 목록이 있으면 그대로 두고 안내만 한다
      if (loadedRef.current) {
        showToast('퀘스트를 새로 불러오지 못했어요.', 'error');
      } else {
        setLoadFailed(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadQuests();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [loadQuests]);

  const dailyQuests = useMemo(
    () => quests.filter(q => q.type === 'DDAY'),
    [quests]
  );

  const weeklyQuests = useMemo(
    () => quests.filter(q => q.type === 'WEEKLY'),
    [quests]
  );

  const visibleQuests = useMemo(() => {
    if (tab === 'DDAY') return dailyQuests;
    if (tab === 'WEEKLY') return weeklyQuests;

    return quests;
  }, [tab, quests, dailyQuests, weeklyQuests]);

  const completedCount = quests.filter(isCompleted).length;

  const completedDaily =
    dailyQuests.filter(isCompleted).length;

  const completedWeekly =
    weeklyQuests.filter(isCompleted).length;

  const completionPercent =
    quests.length > 0
      ? (completedCount / quests.length) * 100
      : 0;

  const totalXp = quests.reduce(
    (sum, quest) => sum + (quest.rewardXp ?? 0),
    0
  );

  const totalCoins = quests.reduce(
    (sum, quest) => sum + (quest.rewardCurrency ?? 0),
    0
  );

  const questImages = [
    ART.reading,
    ART.books,
    ART.bookshelf,
    ART.flag,
    ART.calendar,
    ART.openBook,
    ART.sitting,
    ART.flower,
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={COLORS.green}
        />

        <Text style={styles.loadingText}>
          퀘스트를 불러오는 중...
        </Text>
      </View>
    );
  }

  if (loadFailed) {
    return (
      <LoadFailedView
        title="오늘의 퀘스트"
        message="퀘스트를 불러오지 못했어요."
        onRetry={() => void loadQuests()}
        onBack={() => goBackOr(ROUTES.fe2.level)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadQuests(true)}
          />
        }
      >
        {/* 상단 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => goBackOr(ROUTES.fe2.level)}
            style={styles.backButton}
            hitSlop={HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={COLORS.text}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            오늘의 퀘스트
          </Text>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => loadQuests(true)}
          >
            <Ionicons
              name="refresh"
              size={18}
              color={COLORS.green}
            />
          </TouchableOpacity>
        </View>

        {/* 메인 고양이 배너 */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTextBox}>
            <Text style={styles.heroEyebrow}>
              책다듬이와 함께
            </Text>

            <Text style={styles.heroTitle}>
              오늘도 한 페이지!
            </Text>

            <Text style={styles.heroDescription}>
              작은 독서 습관이 모여{'\n'}
              멋진 하루를 만들어요.
            </Text>
          </View>

          <View style={styles.heroArtBox}>
            <Image
              source={ART.flag}
              style={styles.heroArt}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* 퀘스트 달성률 */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryText}>
              <Text style={styles.cardTitle}>
                나의 퀘스트 달성률
              </Text>

              <Text style={styles.cardSubtitle}>
                오늘도 조금씩 목표를 채워가요.
              </Text>
            </View>

            <View style={styles.summaryArtBox}>
              <Image
                source={ART.booksPlant}
                style={styles.summaryArt}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.summaryCountRow}>
            <Text style={styles.summaryCount}>
              {completedCount}

              <Text style={styles.summaryCountSmall}>
                {' '} / {quests.length}개 완료
              </Text>
            </Text>

            <Text style={styles.summaryPercent}>
              {Math.round(completionPercent)}%
            </Text>
          </View>

          <ProgressBar
            value={completionPercent}
            height={10}
          />

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons
                name="sunny-outline"
                size={20}
                color="#D99552"
              />

              <Text style={styles.statLabel}>
                일일 퀘스트
              </Text>

              <Text style={styles.statValue}>
                {completedDaily}/{dailyQuests.length}
              </Text>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.statItem}>
              <Ionicons
                name="ribbon-outline"
                size={20}
                color={COLORS.green}
              />

              <Text style={styles.statLabel}>
                주간 퀘스트
              </Text>

              <Text style={styles.statValue}>
                {completedWeekly}/
                {weeklyQuests.length}
              </Text>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.statItem}>
              <Ionicons
                name="gift-outline"
                size={20}
                color={COLORS.gold}
              />

              <Text style={styles.statLabel}>
                전체 보상
              </Text>

              <Text style={styles.statValue}>
                {quests.length}개
              </Text>
            </View>
          </View>
        </View>

        {/* 보상 요약 */}
        <View style={styles.rewardSummary}>
          <View style={styles.rewardSummaryText}>
            <Text style={styles.rewardSummaryTitle}>
              퀘스트 보상
            </Text>

            <Text style={styles.rewardSummaryDescription}>
              퀘스트를 완료하면 보상을 받을 수 있어요.
            </Text>
          </View>

          <View style={styles.rewardSummaryValues}>
            <Text style={styles.rewardXp}>
              XP {totalXp}
            </Text>

            <View style={styles.rewardCoinRow}>
              <Icon name="coin" size={14} color={COLORS.gold} />
              <Text style={styles.rewardCoin}>
                {totalCoins}
              </Text>
            </View>
          </View>
        </View>

        {/* 퀘스트 목록 제목 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            나의 퀘스트
          </Text>

          <Text style={styles.sectionCount}>
            {quests.length}개의 퀘스트
          </Text>
        </View>

        {/* 탭 */}
        <View style={styles.tabs}>
          {([
            ['ALL', '전체'],
            ['DDAY', '일일'],
            ['WEEKLY', '주간'],
          ] as const).map(([value, label]) => (
            <TouchableOpacity
              key={value}
              onPress={() => setTab(value)}
              style={[
                styles.tabButton,
                tab === value && styles.tabActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  tab === value && styles.tabTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 퀘스트 카드 */}
        {visibleQuests.length > 0 ? (
          visibleQuests.map(quest => {
            const imageIndex = quests.indexOf(quest);

            return (
              <QuestCard
                key={quest.id}
                quest={quest}
                image={
                  questImages[
                    imageIndex % questImages.length
                  ]
                }
              />
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Image
              source={ART.cushion}
              style={styles.emptyArt}
              resizeMode="contain"
            />

            <Text style={styles.emptyText}>
              표시할 퀘스트가 없어요.
            </Text>
          </View>
        )}

        {/* 응원 배너 */}
        <View style={styles.cheerBanner}>
          <View style={styles.cheerArtBox}>
            <Image
              source={ART.sleeping}
              style={styles.cheerArt}
              resizeMode="contain"
            />
          </View>

          <View style={styles.cheerTextBox}>
            <Text style={styles.cheerTitle}>
              꾸준한 독서가 멋져요!
            </Text>

            <Text style={styles.cheerDescription}>
              오늘도 책다듬이가 응원할게요.
            </Text>
          </View>
        </View>

        {/* 레벨 이동 */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() =>
            router.push('/reward/level' as any)
          }
        >
          <View style={styles.menuIconBox}>
            <Ionicons
              name="sparkles-outline"
              size={22}
              color={COLORS.green}
            />
          </View>

          <View style={styles.menuTextBox}>
            <Text style={styles.menuTitle}>
              나의 레벨
            </Text>

            <Text style={styles.menuDescription}>
              독서 경험치와 성장 확인하기
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={COLORS.secondary}
          />
        </TouchableOpacity>

        {/* 상점 이동 */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() =>
            router.push(ROUTES.fe2.shop)
          }
        >
          <View style={styles.menuIconBox}>
            <Ionicons
              name="storefront-outline"
              size={22}
              color={COLORS.green}
            />
          </View>

          <View style={styles.menuTextBox}>
            <Text style={styles.menuTitle}>
              재화 상점
            </Text>

            <Text style={styles.menuDescription}>
              모은 재화로 아이템 살펴보기
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={COLORS.secondary}
          />
        </TouchableOpacity>

        {/* 하단 책장 일러스트 */}
        <View style={styles.footerArtArea}>
          <Image
            source={ART.bookshelf}
            style={styles.footerArt}
            resizeMode="contain"
          />

          <Text style={styles.footerArtText}>
            한 페이지씩 쌓이는 나만의 독서 이야기
          </Text>
        </View>

        <Text style={styles.footerNotice}>
          퀘스트 완료 판정과 실제 보상 지급은 서버에서 처리됩니다.
        </Text>
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
    maxWidth: 600,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 42,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: COLORS.secondary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  backButton: {
    width: 36,
    height: 44,
    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },

  refreshButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.paleGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 메인 배너
  heroBanner: {
    minHeight: 175,
    backgroundColor: COLORS.cream,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 4,
    marginBottom: 13,
    overflow: 'hidden',
  },

  heroTextBox: {
    flex: 1,
    zIndex: 2,
    paddingVertical: 18,
  },

  heroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.green,
    marginBottom: 8,
  },

  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.darkGreen,
    marginBottom: 10,
  },

  heroDescription: {
    fontSize: 11,
    lineHeight: 19,
    color: '#6D675D',
  },

  // 변경: 고양이 약 10% 확대
  heroArtBox: {
    width: 170,
    height: 175,
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroArt: {
    width: '100%',
    height: '100%',
  },

  // 달성률 카드
  summaryCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 21,
    padding: 16,
    marginBottom: 12,
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  summaryText: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },

  cardSubtitle: {
    marginTop: 6,
    fontSize: 10,
    color: COLORS.secondary,
  },

  // 변경: 책 일러스트 약 15% 확대
  summaryArtBox: {
    width: 100,
    height: 92,
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },

  summaryArt: {
    width: '100%',
    height: '100%',
  },

  summaryCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 5,
    marginBottom: 12,
  },

  summaryCount: {
    fontSize: 25,
    fontWeight: '800',
    color: COLORS.darkGreen,
  },

  summaryCountSmall: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.secondary,
  },

  summaryPercent: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.green,
  },

  progressTrack: {
    width: '100%',
    backgroundColor: COLORS.progress,
    borderRadius: 20,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: COLORS.green,
    borderRadius: 20,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 17,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },

  verticalDivider: {
    width: 1,
    height: 43,
    backgroundColor: COLORS.border,
  },

  statLabel: {
    fontSize: 10,
    color: COLORS.secondary,
  },

  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },

  rewardSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paleGreen,
    borderRadius: 17,
    padding: 15,
    marginBottom: 24,
  },

  rewardSummaryText: {
    flex: 1,
    paddingRight: 8,
  },

  rewardSummaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.darkGreen,
  },

  rewardSummaryDescription: {
    fontSize: 10,
    lineHeight: 16,
    marginTop: 6,
    color: COLORS.green,
  },

  rewardSummaryValues: {
    alignItems: 'flex-end',
    gap: 5,
  },

  rewardXp: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.green,
  },

  rewardCoinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardCoin: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },

  sectionCount: {
    fontSize: 11,
    color: COLORS.secondary,
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#EAE8E2',
    borderRadius: 24,
    padding: 4,
    marginBottom: 14,
  },

  tabButton: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },

  tabActive: {
    backgroundColor: COLORS.green,
  },

  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D6B64',
  },

  tabTextActive: {
    color: '#FFFFFF',
  },

  // 퀘스트 카드
  questCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 19,
    padding: 13,
    marginBottom: 11,
  },

  questCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // 변경: 이미지 주변 여백 축소
  questIllustrationBox: {
    borderRadius: 14,
    backgroundColor: '#F6F1E9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    marginRight: 11,
  },

  // 변경: 작은 일러스트 약 12% 확대
  questIllustration: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.12 }],
  },

  questCardText: {
    flex: 1,
  },

  questTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  questTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
    color: COLORS.text,
  },

  questDescription: {
    marginTop: 6,
    fontSize: 10,
    lineHeight: 16,
    color: COLORS.secondary,
  },

  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 8,
  },

  smallLabel: {
    fontSize: 10,
    color: COLORS.secondary,
  },

  progressValue: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.green,
  },

  questBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },

  rewardBadges: {
    flexDirection: 'row',
    gap: 7,
  },

  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.paleGreen,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
  },

  xpBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.green,
  },

  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FAF0D8',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
  },

  coinBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#916B2F',
  },

  statusBadge: {
    backgroundColor: '#F0EEE8',
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.green,
  },

  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 19,
    alignItems: 'center',
    padding: 20,
    marginBottom: 12,
  },

  emptyArt: {
    width: 115,
    height: 100,
  },

  emptyText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },

  cheerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.paleGreen,
    borderRadius: 18,
    padding: 12,
    marginTop: 12,
    marginBottom: 17,
  },

  cheerArtBox: {
    width: 102,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  cheerArt: {
    width: '100%',
    height: '100%',
  },

  cheerTextBox: {
    flex: 1,
  },

  cheerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.darkGreen,
  },

  cheerDescription: {
    fontSize: 11,
    color: COLORS.green,
    marginTop: 7,
  },

  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    padding: 13,
    marginBottom: 10,
  },

  menuIconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: COLORS.paleGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  menuTextBox: {
    flex: 1,
  },

  menuTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },

  menuDescription: {
    marginTop: 5,
    fontSize: 10,
    color: COLORS.secondary,
  },

  footerArtArea: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 13,
  },

  footerArt: {
    width: 220,
    height: 135,
  },

  footerArtText: {
    fontSize: 11,
    color: COLORS.green,
    textAlign: 'center',
  },

  footerNotice: {
    fontSize: 9,
    color: '#9C968E',
    textAlign: 'center',
    marginTop: 10,
  },
});