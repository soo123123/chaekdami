
import React, {
  useCallback,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  Alert,
  Image,
  Platform,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { isAxiosError } from 'axios';

import { BottomTabBar } from '@/components/BottomTabBar';
import { Icon, type IconName } from '@/components/common/Icon';
import { showToast } from '@/components/Toast';
import { ROUTES, toReadingStart } from '@/constants/routes';
import { readingApi } from '@/features/fe1/api/readingApi';
import type { RegisteredBook } from '@/features/fe1/types/reading';

import { getDday } from '../api/ddayApi';
import {
  activateExpBooster,
  getQuests,
  getRewardStatus,
  getShopItems,
  notifyBoosterUsed,
  type ShopItemResult,
} from '../api/rewardApi';

import {
  getTodayReading,
  type TodayReading,
} from '../api/todayReadingApi';

const GREEN = '#315E49';
const BG = '#FAF7F1';
const COIN_COLOR = '#D9A23B';

const images = {
  banner: require('../../../../assets/images/home/햇살 가득한 책 읽는 공간.png'),
  quest: require('../../../../assets/images/home/quest-cat.png'),
  record: require('../../../../assets/images/home/reading-record.png'),
  profile: require('../../../../assets/images/mypage/profile-cat.png'),
  current: require('../../../../assets/images/books/current-book.png'),
  shield: require('../../../../assets/images/shop/shop-shield-1.png'),
  expBooster: require('../../../../assets/images/shop/shop-exp-1.png'),
};

type SummaryItem = {
  icon: IconName;
  iconColor: string;
  value: string;
  label: string;
  onPress: () => void;
};

type InventoryStatus = {
  shieldCount: number;
  boosterCount: number;
};

// 상품 행별 보유 수량을 종류별로 더한다
function ownedCount(
  items: ShopItemResult[],
  type: ShopItemResult['type']
) {
  return items
    .filter((item) => item.type === type)
    .reduce(
      (sum, item) => sum + (item.ownedQuantity ?? 0),
      0
    );
}

// 응답이 끊겼거나 서버 오류거나 보유 개수가 달라졌으면 부스터가 이미 쓰였을 수 있다
function mayHaveUsedBooster(error: unknown) {
  if (!isAxiosError(error)) return false;

  const status = error.response?.status;

  return (
    status === undefined ||
    status >= 500 ||
    error.response?.data?.code === 'REWARD_008'
  );
}

// 사용에 실패한 뒤 다시 조회한 개수로 실제 결과를 안내한다 (ISSUE-BUG-33)
function boosterFailureMessage(
  error: unknown,
  before: number,
  after: number
) {
  const remaining = `남은 부스터 ${after.toLocaleString()}개`;

  // 요청이 자동으로 다시 보내져 오류를 받았어도 처음 요청은 처리됐을 수 있다
  if (after === before - 1) return `이미 사용됐어요. ${remaining}`;

  if (after !== before && mayHaveUsedBooster(error)) {
    return `보유 개수가 바뀌었어요. ${remaining}`;
  }

  return boosterErrorMessage(error);
}

function boosterErrorMessage(error: unknown) {
  const response = isAxiosError(error)
    ? error.response
    : undefined;
  const message = response?.data?.message;

  return response &&
    response.status < 500 &&
    typeof message === 'string' &&
    message.length > 0
    ? message
    : '부스터를 사용하지 못했어요.';
}

function confirmUseBooster(): Promise<boolean> {
  const title = 'EXP 부스터 사용';
  const message =
    '부스터 1개를 사용할까요? 이미 적용 중이면 30분이 더해져요.';

  if (Platform.OS === 'web') {
    return Promise.resolve(
      window.confirm(`${title}\n${message}`)
    );
  }

  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: '취소',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        { text: '사용', onPress: () => resolve(true) },
      ],
      { cancelable: false }
    );
  });
}

function progressOf(book: RegisteredBook) {
  if (!book.totalPages || book.totalPages <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round(
      (book.currentPage / book.totalPages) * 100
    )
  );
}

function coverOf(
  url: string | undefined,
  fallback: ImageSourcePropType
) {
  return url ? { uri: url } : fallback;
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();

  const compact = width < 600;
  const narrow = width < 380;

  const [questItems, setQuestItems] = useState<
    { title: string; completed: boolean }[]
  >([]);

  // 조회하지 못한 값은 예시나 0 대신 '-'로 보여준다
  const [todayReading, setTodayReading] =
    useState<TodayReading | null>(null);

  const [questError, setQuestError] = useState(false);
  const [bookError, setBookError] = useState(false);

  const [summaryCards, setSummaryCards] = useState({
    ddayValue: '-',
    ddayLabel: '연속 독서',
    currency: '-',
    level: '-',
    levelLabel: '레벨',
  });

  const [currentBook, setCurrentBook] =
    useState<RegisteredBook | null>(null);

  const [inventoryStatus, setInventoryStatus] =
    useState<InventoryStatus>({
      shieldCount: 0,
      boosterCount: 0,
    });

  const [inventoryLoading, setInventoryLoading] =
    useState(true);

  const [inventoryError, setInventoryError] =
    useState(false);

  const [usingBooster, setUsingBooster] =
    useState(false);

  // 확인 창이 떠 있거나 요청 중이면 다시 누를 수 없다
  const boosterBusyRef = useRef(false);

  /**
   * 홈 화면에 진입할 때마다 데이터를 다시 조회한다.
   * 상점에서 아이템을 구매한 뒤 돌아와도 수량이 갱신된다.
   */
  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        setInventoryLoading(true);
        setInventoryError(false);

        const [
          todayResult,
          questResult,
          rewardResult,
          ddayResult,
          booksResult,
          shopResult,
        ] = await Promise.allSettled([
          getTodayReading(),
          getQuests(),
          getRewardStatus(),
          getDday(),
          readingApi.getLibraryBooks(),
          getShopItems(),
        ]);

        if (!active) {
          return;
        }

        setTodayReading(
          todayResult.status === 'fulfilled'
            ? todayResult.value
            : null
        );

        setQuestError(questResult.status === 'rejected');
        setBookError(booksResult.status === 'rejected');

        if (questResult.status === 'fulfilled') {
          const quests = questResult.value;

          setQuestItems(
            quests.slice(0, 3).map((quest) => ({
              title: quest.title,
              completed: quest.completed,
            }))
          );
        }

        const reward =
          rewardResult.status === 'fulfilled'
            ? rewardResult.value
            : null;


        const remainingXp = reward
          ? Math.max(
              0,
              reward.requiredXp - reward.xp
            )
          : 0;

        setSummaryCards({
          ddayValue:
            ddayResult.status === 'fulfilled'
              ? `${ddayResult.value.currentStreak ?? 0}일`
              : '-',
          ddayLabel: '연속 독서',
          currency: reward
            ? reward.currency.toLocaleString()
            : '-',
          level: reward ? `Lv. ${reward.level}` : '-',
          levelLabel: reward
            ? `다음 레벨까지 ${remainingXp.toLocaleString()} XP`
            : '레벨',
        });

        if (booksResult.status === 'fulfilled') {
          const books = booksResult.value;

          const reading = books.find(
            (book) => book.status === 'READING'
          );

          setCurrentBook(reading ?? null);
        }

        const shopItems =
          shopResult.status === 'fulfilled'
            ? shopResult.value
            : [];

        const boosterCount = ownedCount(
          shopItems,
          'EXPERIENCE_BOOSTER'
        );

        const shieldCountFromShop = ownedCount(
          shopItems,
          'SHIELD'
        );

        setInventoryStatus({
          shieldCount:
            reward?.ownedShieldCount ??
            shieldCountFromShop,
          boosterCount,
        });

        setInventoryError(
          rewardResult.status === 'rejected' ||
          shopResult.status === 'rejected'
        );

        setInventoryLoading(false);
      }

      void load();

      return () => {
        active = false;
      };
    }, [])
  );

  const recordItems: {
    icon: IconName;
    value: string;
    label: string;
  }[] = [
    {
      icon: 'clock',
      value: todayReading ? `${todayReading.readingMinutes}분` : '-',
      label: '독서 시간',
    },
    {
      icon: 'book',
      value: todayReading ? `${todayReading.pagesRead}쪽` : '-',
      label: '읽은 페이지',
    },
    {
      icon: 'pencil',
      value: todayReading ? `${todayReading.memoCount}개` : '-',
      label: '작성한 메모',
    },
  ];

  const handleStartReading = () => {
    if (currentBook) {
      router.push(
        toReadingStart(currentBook.bookId)
      );
      return;
    }

    router.push(ROUTES.fe1.library);
  };

  const handleLibrary = () => {
    router.push(ROUTES.fe1.library);
  };

  const goToDday = () => {
    router.push('/fe2/reward/dday');
  };

  const goToShop = () => {
    router.push('/fe2/reward/shop');
  };

  const boosterDisabled =
    inventoryLoading ||
    inventoryError ||
    usingBooster ||
    inventoryStatus.boosterCount <= 0;

  const setBoosterCount = (boosterCount: number) => {
    setInventoryStatus((current) => ({
      ...current,
      boosterCount,
    }));
  };

  const handleUseBooster = async () => {
    if (boosterDisabled || boosterBusyRef.current) return;

    boosterBusyRef.current = true;

    // 사용자가 보고 누른 개수
    const before = inventoryStatus.boosterCount;

    try {
      if (!(await confirmUseBooster())) return;

      setUsingBooster(true);

      const result = await activateExpBooster(before);

      setBoosterCount(result.remainingBoosters);
      showToast('EXP 부스터를 사용했어요.');
    } catch (error) {
      const mayHaveUsed = mayHaveUsedBooster(error);

      // 실제 보유 개수를 다시 확인해 안내만 한다 (자동으로 다시 사용하지 않는다)
      try {
        const after = ownedCount(
          await getShopItems(),
          'EXPERIENCE_BOOSTER'
        );

        setBoosterCount(after);

        if (after === before - 1 || (mayHaveUsed && after !== before)) {
          notifyBoosterUsed();
        }

        showToast(
          boosterFailureMessage(error, before, after),
          'error'
        );
      } catch {
        setInventoryError(true);

        if (mayHaveUsed) notifyBoosterUsed();

        showToast(
          mayHaveUsed
            ? '사용 결과를 확인하지 못했어요. 잠시 후 다시 확인해 주세요.'
            : boosterErrorMessage(error),
          'error'
        );
      }
    } finally {
      boosterBusyRef.current = false;
      setUsingBooster(false);
    }
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
    <SafeAreaView
      style={styles.root}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 상단 배너 */}
        <View
          style={[
            styles.banner,
            compact && styles.bannerCompact,
          ]}
        >
          <Image
            source={images.banner}
            style={styles.bannerBackgroundImage}
            resizeMode="stretch"
          />

          <View
            pointerEvents="none"
            style={styles.bannerTextShade}
          />

          <View style={styles.bannerText}>
            <Text
              style={[
                styles.greeting,
                compact && styles.greetingCompact,
                narrow && styles.greetingNarrow,
              ]}
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              오늘도,{'\n'}좋은 책과 함께해요!
            </Text>

            <Text
              style={[
                styles.subtitle,
                compact && styles.subtitleCompact,
              ]}
              numberOfLines={2}
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
            hitSlop={{
              top: 8,
              bottom: 8,
              left: 8,
              right: 8,
            }}
          >
            <Image
              source={images.profile}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>

        {/* D-day / 보유 재화 / 레벨 */}
        <View style={styles.summaryRow}>
          {(
            [
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
            ] as SummaryItem[]
          ).map((item) => (
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

            <TouchableOpacity
              onPress={handleLibrary}
              style={styles.moreButton}
            >
              <Text style={styles.more}>
                더보기
              </Text>

              <Icon
                name="chevronRight"
                size={14}
                color="#55514C"
              />
            </TouchableOpacity>
          </View>

          {currentBook ? (
            <View style={styles.currentBookRow}>
              <Image
                source={coverOf(
                  currentBook.coverImageUrl,
                  images.current
                )}
                style={
                  compact
                    ? styles.currentCoverCompact
                    : styles.currentCover
                }
                resizeMode="cover"
              />

              <View style={styles.currentInfo}>
                <Text
                  style={styles.currentTitle}
                  numberOfLines={2}
                >
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
                        {
                          width: `${progressOf(
                            currentBook
                          )}%`,
                        },
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
                  {bookError
                    ? '책을 불러오지 못했어요.'
                    : '아직 읽고 있는 책이 없어요.'}
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

        {/* 나의 보유 아이템: 최근 읽은 책 영역 대체 */}
        <View style={styles.inventorySection}>
          <View style={styles.inventoryHeader}>
            <Text style={styles.sectionTitle}>
              나의 보유 아이템
            </Text>

            <TouchableOpacity
              onPress={goToShop}
              style={styles.moreButton}
              activeOpacity={0.75}
            >
              <Text style={styles.more}>
                상점 가기
              </Text>

              <Icon
                name="chevronRight"
                size={14}
                color="#55514C"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inventoryRow}>
            {/* D-day 방어권 */}
            <View style={styles.inventoryItem}>
              <View style={styles.inventoryIconWrap}>
                <Image
                  source={images.shield}
                  style={styles.inventoryImage}
                  resizeMode="contain"
                />
              </View>

              <Text
                style={styles.inventoryLabel}
                numberOfLines={2}
              >
                D-day 방어권
              </Text>

              <Text
                style={styles.inventoryValue}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {inventoryLoading
                  ? '...'
                  : inventoryError
                    ? '확인 필요'
                    : `${inventoryStatus.shieldCount.toLocaleString()}개`}
              </Text>
            </View>

            {/* 경험치병 보유 수량 */}
            <View style={styles.inventoryItem}>
              <View style={styles.inventoryIconWrap}>
                <Image
                  source={images.expBooster}
                  style={styles.inventoryImage}
                  resizeMode="contain"
                />
              </View>

              <Text
                style={styles.inventoryLabel}
                numberOfLines={2}
              >
                경험치병
              </Text>

              <Text
                style={styles.inventoryValue}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {inventoryLoading
                  ? '...'
                  : inventoryError
                    ? '확인 필요'
                    : `${inventoryStatus.boosterCount.toLocaleString()}개`}
              </Text>

              <TouchableOpacity
                style={[
                  styles.boosterButton,
                  boosterDisabled && styles.boosterButtonDisabled,
                ]}
                onPress={handleUseBooster}
                disabled={boosterDisabled}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="EXP 부스터 사용하기"
              >
                <Text style={styles.boosterButtonText}>
                  {usingBooster ? '사용 중…' : '사용하기'}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
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
                  <Text style={styles.questItem}>
                    {questError
                      ? '퀘스트를 불러오지 못했어요'
                      : '오늘 퀘스트가 없어요'}
                  </Text>
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
                        <Icon
                          name="check"
                          size={13}
                          color="#FFFFFF"
                        />
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

      {/* 하단 내비게이션 */}
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
    height: 380,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F7EBDD',
    position: 'relative',
  },

  bannerCompact: {
    height: 260,
  },

  bannerBackgroundImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },

  bannerTextShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '72%',
    height: '48%',
    backgroundColor: 'rgba(255, 248, 236, 0.12)',
  },

  bannerText: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 70,
    zIndex: 2,
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

  greetingNarrow: {
    fontSize: 19,
    lineHeight: 27,
  },

  subtitle: {
    fontSize: 14,
    color: '#4C4035',
    marginTop: 12,
  },

  subtitleCompact: {
    fontSize: 10,
    marginTop: 7,
    lineHeight: 15,
  },

  avatar: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 42,
    height: 42,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    zIndex: 3,
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

  /* 나의 보유 아이템 */

  inventorySection: {
    width: '100%',
    backgroundColor: '#FFFDF9',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginBottom: 16,
  },

  inventoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  inventoryRow: {
    flexDirection: 'row',
    gap: 8,
  },

  inventoryItem: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#F5F6F0',
    borderRadius: 17,
    paddingVertical: 8,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 112,
  },

  inventoryIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  inventoryImage: {
    width: 58,
    height: 58,
  },

  inventoryLabel: {
    fontSize: 11,
    lineHeight: 15,
    color: '#625F59',
    textAlign: 'center',
    minHeight: 30,
  },

  inventoryValue: {
    fontSize: 19,
    fontWeight: '800',
    color: GREEN,
    textAlign: 'center',
    marginTop: 7,
    width: '100%',
  },

  boosterButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: GREEN,
  },

  boosterButtonDisabled: {
    opacity: 0.4,
  },

  boosterButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
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
