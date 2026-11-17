
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { BottomTabBar } from '@/components/BottomTabBar';
import { Icon, type IconName } from '@/components/common/Icon';
import { ROUTES, toReadingStart } from '@/constants/routes';
import { readingApi } from '@/features/fe1/api/readingApi';
import type { RegisteredBook } from '@/features/fe1/types/reading';
import { getDday } from '../api/ddayApi';
import { summarizeDday } from '../api/ddayStreak';
import { getQuests, getRewardStatus } from '../api/rewardApi';
import { getTodayReading } from '../api/todayReadingApi';

const GREEN = '#315E49';
const BG = '#FAF7F1';

// 실제 frontend/assets/images 폴더 기준
const images = {
  banner: require('../../../../assets/images/home/햇살 가득한 책 읽는 공간.png'),
  quest: require('../../../../assets/images/home/quest-cat.png'),
  record: require('../../../../assets/images/home/reading-record.png'),
  // 마이페이지 프로필과 같은 고양이 (이모지 🐱는 기기에 따라 네모로 나와서 이미지로 바꿈)
  profile: require('../../../../assets/images/mypage/profile-cat.png'),
  current: require('../../../../assets/images/books/current-book.png'),
  recent1: require('../../../../assets/images/books/recent-book-1.png'),
  recent2: require('../../../../assets/images/books/recent-book-2.png'),
  recent3: require('../../../../assets/images/books/recent-book-3.png'),
  recent4: require('../../../../assets/images/books/recent-book-4.png'),
  recent5: require('../../../../assets/images/books/recent-book-5.png'),
  recent6: require('../../../../assets/images/books/recent-book-6.png'),
};

const recentFallbacks = [
  images.recent1,
  images.recent2,
  images.recent3,
  images.recent4,
  images.recent5,
  images.recent6,
];

const COIN_COLOR = '#D9A23B';

function progressOf(book: RegisteredBook) {
  if (!book.totalPages || book.totalPages <= 0) return 0;
  return Math.min(100, Math.round((book.currentPage / book.totalPages) * 100));
}

function coverOf(url: string | undefined, fallback: ImageSourcePropType) {
  return url ? { uri: url } : fallback;
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 600;
  const [questItems, setQuestItems] = useState<
    { title: string; completed: boolean }[]
  >([]);
  const [todayReading, setTodayReading] = useState({
    readingMinutes: 0,
    pagesRead: 0,
    memoCount: 0,
  });
  const [summaryCards, setSummaryCards] = useState({
    ddayValue: '0일',
    ddayLabel: '연속 독서',
    currency: '0',
    level: 'Lv. 1',
    levelLabel: '다음 레벨까지 0 XP',
  });
  const [currentBook, setCurrentBook] = useState<RegisteredBook | null>(null);
  const [recentBooks, setRecentBooks] = useState<RegisteredBook[]>([]);

  const loadToday = useCallback(() => {
    let active = true;

    async function load() {
      const [todayResult, questResult, rewardResult, ddayResult, booksResult] =
        await Promise.allSettled([
          getTodayReading(),
          getQuests(),
          getRewardStatus(),
          getDday(),
          readingApi.getLibraryBooks(),
        ]);

      if (!active) return;

      if (todayResult.status === 'fulfilled') {
        setTodayReading(todayResult.value);
      }

      if (questResult.status === 'fulfilled') {
        const quests = questResult.value;
        setQuestItems(
          quests.slice(0, 3).map((quest) => ({
            title: quest.title,
            completed: quest.completed,
          }))
        );
      }

      const reward = rewardResult.status === 'fulfilled' ? rewardResult.value : null;
      const records = ddayResult.status === 'fulfilled' ? ddayResult.value.records ?? {} : {};
      const remainingXp = reward
        ? Math.max(0, reward.requiredXp - reward.xp)
        : 0;

      setSummaryCards({
        ddayValue: `${summarizeDday(records).currentStreak}일`,
        ddayLabel: '연속 독서',
        currency: (reward?.currency ?? 0).toLocaleString(),
        level: `Lv. ${reward?.level ?? 1}`,
        levelLabel: `다음 레벨까지 ${remainingXp.toLocaleString()} XP`,
      });

      if (booksResult.status === 'fulfilled') {
        const books = booksResult.value;
        const reading = books.find((book) => book.status === 'READING');
        setCurrentBook(reading ?? null);
        setRecentBooks(
          books
            .filter(
              (book) =>
                book.bookId !== reading?.bookId &&
                (book.status === 'COMPLETED' ||
                  book.status === 'READING' ||
                  book.currentPage > 0)
            )
            .slice(0, 6)
        );
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(loadToday);

  const recordItems: { icon: IconName; value: string; label: string }[] = [
    { icon: 'clock', value: `${todayReading.readingMinutes}분`, label: '독서 시간' },
    { icon: 'book', value: `${todayReading.pagesRead}쪽`, label: '읽은 페이지' },
    { icon: 'pencil', value: `${todayReading.memoCount}개`, label: '작성한 메모' },
  ];

  const handleStartReading = () => {
    if (currentBook) {
      router.push(toReadingStart(currentBook.bookId));
      return;
    }

    router.push(ROUTES.fe1.library);
  };

  const handleLibrary = () => {
    router.push(ROUTES.fe1.library);
  };

  // FE2 화면 이동
  const goToDday = () => {
    router.push('/fe2/reward/dday');
  };

  const goToShop = () => {
    router.push('/fe2/reward/shop');
  };

  const goToLevel = () => {
    router.push('/fe2/reward/reward');
  };

  const goToMyPage = () => {
    router.push('/fe2/user/mypage');
  };

  const goToReadingStats = () => {
    router.push('/fe2/user/reading-stats');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 상단 배너 */}
        <ImageBackground
          source={images.banner}
          resizeMode="cover"
          style={[
            styles.banner,
            { height: compact ? 240 : 380 },
          ]}
          imageStyle={styles.bannerImage}
        >
          <View style={styles.bannerTop}>
            <View style={styles.bannerText}>
              <Text
                style={[
                  styles.greeting,
                  compact && styles.greetingCompact,
                ]}
              >
                오늘도,{'\n'}좋은 책과 함께해요!
              </Text>

              <Text
                style={[
                  styles.subtitle,
                  compact && styles.subtitleCompact,
                ]}
              >
                조금씩, 꾸준히. 그게 큰 변화를 만들어요.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.avatar}
              onPress={goToMyPage}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="마이페이지"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Image
                source={images.profile}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* D-day / 보유 재화 / 레벨 */}
        <View style={styles.summaryRow}>
          {([
            {
              icon: 'calendarOutline',
              iconColor: GREEN,
              value: summaryCards.ddayValue,
              label: summaryCards.ddayLabel,
              onPress: goToDday,
            },
            {
              icon: 'coin',
              iconColor: COIN_COLOR,
              value: summaryCards.currency,
              label: '보유 재화',
              onPress: goToShop,
            },
            {
              icon: 'leaf',
              iconColor: GREEN,
              value: summaryCards.level,
              label: summaryCards.levelLabel,
              onPress: goToLevel,
            },
          ] as { icon: IconName; iconColor: string; value: string; label: string; onPress: () => void }[]).map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.summaryCard}
              onPress={item.onPress}
              activeOpacity={0.75}
            >
              <Icon
                name={item.icon}
                size={25}
                color={item.iconColor}
                style={styles.summaryIcon}
              />

              <Text
                style={styles.summaryValue}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {item.value}
              </Text>

              <Text
                style={styles.summaryLabel}
                numberOfLines={2}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 현재 읽고 있는 책 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              현재 읽고 있는 책
            </Text>

            <TouchableOpacity onPress={handleLibrary} style={styles.moreButton}>
              <Text style={styles.more}>더보기</Text>
              <Icon name="chevronRight" size={14} color="#55514C" />
            </TouchableOpacity>
          </View>

          {currentBook ? (
            <View style={styles.currentBookRow}>
              <Image
                source={coverOf(currentBook.coverImageUrl, images.current)}
                style={
                  compact
                    ? styles.currentCoverCompact
                    : styles.currentCover
                }
                resizeMode="cover"
              />

              <View style={styles.currentInfo}>
                <Text style={styles.currentTitle} numberOfLines={2}>
                  {currentBook.title}
                </Text>

                <Text style={styles.author}>
                  {currentBook.author || '저자 미상'}
                </Text>

                <View style={styles.progressRow}>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progressOf(currentBook)}%` },
                      ]}
                    />
                  </View>

                  <Text style={styles.progressText}>
                    {progressOf(currentBook)}%
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={handleStartReading}
                >
                  <Text style={styles.continueText}>
                    이어읽기
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.currentBookRow}>
              <View style={styles.currentInfo}>
                <Text style={styles.author}>
                  아직 읽고 있는 책이 없어요.
                </Text>

                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={handleLibrary}
                >
                  <Text style={styles.continueText}>
                    서재로 가기
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* 최근 읽은 책 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              최근 읽은 책
            </Text>

            <TouchableOpacity onPress={handleLibrary} style={styles.moreButton}>
              <Text style={styles.more}>더보기</Text>
              <Icon name="chevronRight" size={14} color="#55514C" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {recentBooks.length === 0 ? (
              <Text style={styles.author}>최근 읽은 책이 없어요.</Text>
            ) : recentBooks.map((book, index) => (
              <TouchableOpacity
                key={book.bookId}
                style={styles.recentBook}
                onPress={() => router.push(toReadingStart(book.bookId))}
                activeOpacity={0.8}
              >
                <Image
                  source={coverOf(
                    book.coverImageUrl,
                    recentFallbacks[index % recentFallbacks.length]
                  )}
                  style={styles.recentCover}
                  resizeMode="cover"
                />

                <Text
                  style={styles.recentTitle}
                  numberOfLines={2}
                >
                  {book.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 오늘의 퀘스트 / 오늘의 독서 기록 */}
        <View
          style={[
            styles.bottomCards,
            compact && styles.bottomCompact,
          ]}
        >
          {/* 오늘의 퀘스트 */}
          <View
            style={[
              styles.bottomCard,
              styles.questCard,
              compact && styles.bottomCardCompact,
            ]}
          >
            <Text style={styles.sectionTitle}>
              오늘의 퀘스트
            </Text>

            <View style={styles.questBody}>
              <Image
                source={images.quest}
                style={[
                  styles.questImage,
                  compact && styles.questImageCompact,
                ]}
                resizeMode="contain"
              />

              <View style={styles.questList}>
                {questItems.length === 0 ? (
                  <Text style={styles.questItem}>오늘 퀘스트가 없어요</Text>
                ) : null}
                {questItems.map((item) => (
                  <View
                    key={item.title}
                    style={styles.questRow}
                  >
                    <View
                      style={[
                        styles.questCircle,
                        item.completed &&
                          styles.questCircleCompleted,
                      ]}
                    >
                      {item.completed && (
                        <Icon name="check" size={13} color="#FFFFFF" />
                      )}
                    </View>

                    <Text
                      style={styles.questItem}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* 오늘의 독서 기록 */}
          <TouchableOpacity
            style={[
              styles.bottomCard,
              styles.recordCard,
              compact && styles.bottomCardCompact,
            ]}
            onPress={goToReadingStats}
            activeOpacity={0.85}
          >
            <Text style={styles.sectionTitle}>
              오늘의 독서 기록
            </Text>

            <View style={styles.recordBody}>
              <Image
                source={images.record}
                style={[
                  styles.recordImage,
                  compact && styles.recordImageCompact,
                ]}
                resizeMode="contain"
              />

              <View style={styles.recordStats}>
                {recordItems.map((item) => (
                  <View
                    key={item.label}
                    style={styles.recordStat}
                  >
                    <Icon
                      name={item.icon}
                      size={25}
                      color={GREEN}
                      style={styles.recordIcon}
                    />

                    <Text
                      style={styles.recordValue}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {item.value}
                    </Text>

                    <Text
                      style={styles.recordLabel}
                      numberOfLines={2}
                    >
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 공용 하단 탭바 (FE1 서재와 동일) */}
      <BottomTabBar active="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },

  scroll: {
    flex: 1,
  },

  content: {
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    padding: 12,
    paddingBottom: 28,
  },

  banner: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    padding: 16,
    justifyContent: 'flex-start',
  },

  bannerImage: {
    borderRadius: 24,
  },

  bannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  bannerText: {
    flex: 1,
  },

  greeting: {
    fontSize: 36,
    lineHeight: 48,
    fontWeight: '800',
    color: '#241C15',
  },

  greetingCompact: {
    fontSize: 21,
    lineHeight: 29,
  },

  subtitle: {
    fontSize: 14,
    color: '#4C4035',
    marginTop: 12,
  },

  subtitleCompact: {
    fontSize: 10,
    marginTop: 7,
  },

  avatar: {
    width: 42,
    height: 42,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  avatarImage: {
    width: 42,
    height: 42,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    marginBottom: 16,
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#EFF1E9',
  },

  summaryCard: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDF9',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 5,
  },

  summaryIcon: {
    marginBottom: 5,
  },

  summaryValue: {
    fontSize: 19,
    fontWeight: '800',
    color: GREEN,
    textAlign: 'center',
    width: '100%',
  },

  summaryLabel: {
    fontSize: 10,
    color: '#6E6B66',
    marginTop: 5,
    textAlign: 'center',
    lineHeight: 14,
  },

  section: {
    backgroundColor: '#FFFDF9',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#211B16',
  },

  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  more: {
    fontSize: 13,
    color: '#55514C',
  },

  currentBookRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  currentCover: {
    width: 120,
    height: 175,
    borderRadius: 9,
  },

  currentCoverCompact: {
    width: 105,
    height: 155,
    borderRadius: 9,
  },

  currentInfo: {
    flex: 1,
    marginLeft: 16,
    minWidth: 0,
  },

  currentTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#241C15',
  },

  author: {
    fontSize: 13,
    color: '#6C655F',
    marginTop: 6,
  },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 22,
  },

  progressTrack: {
    height: 12,
    backgroundColor: '#E7E7E7',
    borderRadius: 10,
    flex: 1,
    overflow: 'hidden',
  },

  progressFill: {
    width: '45%',
    height: '100%',
    backgroundColor: GREEN,
    borderRadius: 10,
  },

  progressText: {
    fontSize: 13,
    color: '#28231F',
  },

  continueButton: {
    backgroundColor: GREEN,
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'flex-start',
    marginTop: 18,
  },

  continueText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  recentBook: {
    width: 100,
    marginRight: 12,
  },

  recentCover: {
    width: 100,
    height: 140,
    borderRadius: 8,
  },

  recentTitle: {
    textAlign: 'center',
    fontSize: 12,
    color: '#2D2925',
    marginTop: 8,
    lineHeight: 17,
  },

  bottomCards: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
  },

  bottomCompact: {
    flexDirection: 'column',
  },

  bottomCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 24,
    padding: 20,
    minHeight: 190,
    overflow: 'hidden',
  },

  bottomCardCompact: {
    flex: 0,
    minHeight: 170,
    padding: 16,
  },

  questCard: {
    backgroundColor: '#F8F1E9',
  },

  questBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    minHeight: 110,
  },

  questImage: {
    width: 145,
    height: 135,
  },

  questImageCompact: {
    width: 125,
    height: 125,
  },

  questList: {
    flex: 1,
    marginLeft: 8,
    gap: 13,
    minWidth: 0,
  },

  questRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  questCircle: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#8CA596',
    backgroundColor: '#FFFDF9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  questCircleCompleted: {
    backgroundColor: '#5E916E',
    borderColor: '#5E916E',
  },


  questItem: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: '#45423E',
  },

  recordCard: {
    backgroundColor: '#F0F3EB',
  },

  recordBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    minHeight: 110,
  },

  recordImage: {
    width: 155,
    height: 125,
  },

  recordImageCompact: {
    width: 125,
    height: 115,
  },

  recordStats: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 6,
    minWidth: 0,
  },

  recordStat: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 2,
  },

  recordIcon: {
    marginBottom: 9,
  },

  recordValue: {
    fontSize: 18,
    fontWeight: '800',
    color: GREEN,
    textAlign: 'center',
  },

  recordLabel: {
    fontSize: 10,
    lineHeight: 15,
    color: '#666666',
    marginTop: 7,
    textAlign: 'center',
  },
});
