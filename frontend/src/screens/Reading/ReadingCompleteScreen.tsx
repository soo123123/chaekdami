
import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import {
  router,
  useLocalSearchParams,
} from 'expo-router';

const COLORS = {
  background: '#FCF9F4',
  white: '#FFFFFF',
  green: '#506D58',
  darkGreen: '#405F4B',
  dark: '#292925',
  brown: '#795C3D',
  gray: '#96918A',
  border: '#F0E4D5',
  cream: '#FFF1DC',
  lightGreen: '#EFF3EB',
};

const IMAGES = {
  banner: require('../../../assets/images/reading-complete/complete-banner.png'),
  questCat: require('../../../assets/images/reading-complete/complete-quest-cat.png'),
  books: require('../../../assets/images/reading-complete/complete-books.png'),
  coin: require('../../../assets/images/reading-complete/complete-coin.png'),
  flame: require('../../../assets/images/reading-complete/complete-flame.png'),
  sprout: require('../../../assets/images/reading-complete/complete-sprout.png'),
  clock: require('../../../assets/images/reading-complete/complete-clock.png'),
  pages: require('../../../assets/images/reading-complete/complete-pages.png'),
  focus: require('../../../assets/images/reading-complete/complete-focus.png'),
  check: require('../../../assets/images/reading-complete/complete-check.png'),
  unchecked: require('../../../assets/images/reading-complete/complete-unchecked.png'),
};

type RouteParams = {
  readingRecordId?: string | string[];
  durationMinutes?: string | string[];
  pagesRead?: string | string[];
  focusPercent?: string | string[];
  coinReward?: string | string[];
  level?: string | string[];
  dday?: string | string[];
};

function first(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function readNumber(value?: string | string[]) {
  const raw = first(value);

  if (raw === undefined || raw.trim() === '') {
    return null;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function formatDuration(minutes: number) {
  const total = Math.floor(minutes);
  const hours = Math.floor(total / 60);
  const remaining = total % 60;

  if (hours === 0) {
    return `${remaining}분`;
  }

  if (remaining === 0) {
    return `${hours}시간`;
  }

  return `${hours}시간 ${remaining}분`;
}

type QuestItemProps = {
  title: string;
  completed: boolean;
};

function QuestItem({
  title,
  completed,
}: QuestItemProps) {
  return (
    <View style={styles.questItem}>
      <Image
        source={
          completed
            ? IMAGES.check
            : IMAGES.unchecked
        }
        style={styles.questCheckImage}
        resizeMode="contain"
      />

      <Text style={styles.questText}>
        {title}
      </Text>
    </View>
  );
}

type StatItemProps = {
  image: any;
  label: string;
  value: string;
};

function StatItem({
  image,
  label,
  value,
}: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <Image
        source={image}
        style={styles.statIcon}
        resizeMode="contain"
      />

      <Text style={styles.statLabel}>
        {label}
      </Text>

      <Text
        style={styles.statValue}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {value}
      </Text>
    </View>
  );
}

export default function ReadingCompleteScreen() {
  const { width } = useWindowDimensions();

  const params =
    useLocalSearchParams<RouteParams>();

  const readingRecordId =
    first(params.readingRecordId);

  const duration =
    readNumber(params.durationMinutes);

  const pages =
    readNumber(params.pagesRead);

  const focus =
    readNumber(params.focusPercent);

  const reward =
    readNumber(params.coinReward);

  const level =
    readNumber(params.level);

  const dday =
    first(params.dday);

  const durationText =
    formatDuration(duration ?? 80);

  const pagesText =
    `${Math.floor(pages ?? 60)}페이지`;

  const focusText =
    `${Math.min(
      100,
      Math.round(focus ?? 94)
    )}%`;

  const questItems = [
    {
      title: '30분 이상 독서하기',
      completed:
        duration !== null &&
        duration >= 30,
    },
    {
      title: '매일 독서 기록 남기기',
      completed: false,
    },
    {
      title: '오늘 50페이지 읽기',
      completed:
        pages !== null &&
        pages >= 50,
    },
  ];

  const completedCount =
    questItems.filter(
      (quest) => quest.completed
    ).length;

  const hasExampleStats =
    duration === null ||
    pages === null ||
    focus === null;

  const isCompact = width < 370;

  const goHome = () => {
    router.replace('/');
  };

  const continueReading = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  // 독후감 작성 화면으로 이동
  const goToReviewWrite = () => {
    router.push({
     pathname: '/fe2/review/review-write',
      params: readingRecordId
        ? { readingRecordId }
        : {},
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 상단 독서 완료 배너 */}
      <View style={styles.banner}>
        <Image
          source={IMAGES.banner}
          style={styles.bannerImage}
          resizeMode="stretch"
        />
      </View>

      {/* D-day 및 레벨 */}
      <View style={styles.statusCard}>
        <View style={styles.statusColumn}>
          <View style={styles.statusHeading}>
            <Image
              source={IMAGES.flame}
              style={styles.statusIcon}
              resizeMode="contain"
            />

            <Text style={styles.statusLabel}>
              D-day
            </Text>
          </View>

          <Text
            style={styles.statusValue}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {dday
              ? `D-${dday}`
              : '독서 완료'}
          </Text>

          <Text style={styles.statusDescription}>
            오늘도 꾸준히!
          </Text>
        </View>

        <View style={styles.statusDivider} />

        <View style={styles.statusColumn}>
          <View style={styles.statusHeading}>
            <Image
              source={IMAGES.sprout}
              style={styles.statusIcon}
              resizeMode="contain"
            />

            <Text style={styles.statusLabel}>
              레벨
            </Text>
          </View>

          <Text
            style={styles.statusValue}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {level !== null
              ? `Lv. ${Math.floor(level)}`
              : '성장 중'}
          </Text>

          <Text style={styles.statusDescription}>
            기록을 쌓아보세요
          </Text>
        </View>
      </View>

      {/* 오늘의 독서 기록 */}
      <View style={styles.card}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionEmoji}>
            ▥
          </Text>

          <Text style={styles.sectionTitle}>
            오늘의 독서 기록
          </Text>
        </View>

        <View style={styles.statsRow}>
          <StatItem
            image={IMAGES.clock}
            label="독서 시간"
            value={durationText}
          />

          <View style={styles.statDivider} />

          <StatItem
            image={IMAGES.pages}
            label="읽은 페이지"
            value={pagesText}
          />

          <View style={styles.statDivider} />

          <StatItem
            image={IMAGES.focus}
            label="독서 집중도"
            value={focusText}
          />
        </View>

        <Text style={styles.dataNotice}>
          {hasExampleStats
            ? '전달된 독서 기록이 없는 항목은 예시 수치를 사용합니다.'
            : '전달된 독서 기록을 기준으로 표시됩니다.'}
        </Text>
      </View>

      {/* 퀘스트 달성 현황 */}
      <View style={styles.questCard}>
        <View style={styles.questHeader}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionEmoji}>
              ▣
            </Text>

            <Text style={styles.sectionTitle}>
              퀘스트 달성 현황
            </Text>
          </View>

          <Text style={styles.questCount}>
            {completedCount} / 3 완료
          </Text>
        </View>

        <View style={styles.questContent}>
          <View style={styles.questList}>
            {questItems.map(
              (quest, index) => (
                <QuestItem
                  key={index}
                  title={quest.title}
                  completed={quest.completed}
                />
              )
            )}
          </View>

          <Image
            source={IMAGES.questCat}
            style={[
              styles.questCat,
              isCompact && {
                width: 95,
                height: 110,
              },
            ]}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.questNotice}>
          퀘스트 달성 여부는 현재 화면에서 계산한
          임시 결과이며, 실제 보상은 서버 연동 후
          반영됩니다.
        </Text>
      </View>

      {/* 새로 추가: 독후감 쓰러가기 */}
      <Pressable
        style={({ pressed }) => [
          styles.reviewCard,
          pressed && styles.reviewCardPressed,
        ]}
        onPress={goToReviewWrite}
      >
        <View style={styles.reviewIconBox}>
          <Text style={styles.reviewIcon}>
            ✍️
          </Text>
        </View>

        <View style={styles.reviewTextBox}>
          <Text style={styles.reviewTitle}>
            독후감 작성
          </Text>

          <Text style={styles.reviewDescription}>
            오늘 읽은 책의 감상을 기록해보세요.
          </Text>
        </View>
      </Pressable>

      {/* 크기를 줄인 오늘의 보상 */}
      <View style={styles.rewardCard}>
        <View style={styles.rewardLeft}>
          <View style={styles.rewardHeading}>
            <Image
              source={IMAGES.coin}
              style={styles.coinIcon}
              resizeMode="contain"
            />

            <Text style={styles.rewardTitle}>
              오늘의 보상
            </Text>
          </View>

          <Text style={styles.rewardLabel}>
            독서 코인
          </Text>

          <Text style={styles.rewardValue}>
            +{Math.floor(reward ?? 300)}
          </Text>

          <Text style={styles.rewardNotice}>
            {reward === null
              ? '예시 보상 · 미지급'
              : '전달된 보상 값 · 지급 여부 미확인'}
          </Text>
        </View>

        <View style={styles.rewardDivider} />

        <Image
          source={IMAGES.books}
          style={styles.rewardBooks}
          resizeMode="contain"
        />
      </View>

      {/* 하단 버튼 */}
      <View style={styles.buttonRow}>
        <Pressable
          style={styles.homeButton}
          onPress={goHome}
        >
          <Text style={styles.homeButtonText}>
            홈으로 이동
          </Text>
        </Pressable>

        <Pressable
          style={styles.continueButton}
          onPress={continueReading}
        >
          <Text style={styles.continueButtonText}>
            계속 독서하기
          </Text>
        </Pressable>
      </View>

      {/* 하단 문구 */}
      <View style={styles.footer}>
        <Image
          source={IMAGES.sprout}
          style={styles.footerSprout}
          resizeMode="contain"
        />

        <Text style={styles.footerText}>
          매일의 꾸준함이 나를 성장하게 합니다.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 42,
    gap: 13,
  },

  banner: {
    width: '100%',
    aspectRatio: 3.6,
    backgroundColor: COLORS.cream,
    borderRadius: 24,
    overflow: 'hidden',
  },

  bannerImage: {
    width: '100%',
    height: '100%',
  },

  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 8,
  },

  statusColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  statusHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  statusIcon: {
    width: 30,
    height: 30,
  },

  statusLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.brown,
  },

  statusValue: {
    fontSize: 23,
    fontWeight: '900',
    color: COLORS.green,
  },

  statusDescription: {
    fontSize: 12,
    color: COLORS.gray,
  },

  statusDivider: {
    width: 1,
    height: 88,
    backgroundColor: COLORS.border,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 17,
    gap: 16,
  },

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  sectionEmoji: {
    fontSize: 22,
    color: COLORS.green,
    fontWeight: '800',
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.dark,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  statIcon: {
    width: 27,
    height: 27,
  },

  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
  },

  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.dark,
    textAlign: 'center',
  },

  statDivider: {
    width: 1,
    height: 65,
    backgroundColor: COLORS.border,
  },

  dataNotice: {
    fontSize: 10,
    color: '#A49D94',
    textAlign: 'center',
    lineHeight: 16,
  },

  questCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 13,
  },

  questHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  questCount: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.green,
  },

  questContent: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 132,
  },

  questList: {
    flex: 1,
    gap: 13,
  },

  questItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  questCheckImage: {
    width: 25,
    height: 25,
  },

  questText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#57534D',
  },

  questCat: {
    width: 112,
    height: 128,
    marginRight: -7,
  },

  questNotice: {
    fontSize: 10,
    color: '#A49D94',
    lineHeight: 16,
  },

  // 독후감 작성 이동 카드
  reviewCard: {
    backgroundColor: COLORS.lightGreen,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E1E9DD',
    paddingVertical: 17,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  reviewCardPressed: {
    opacity: 0.75,
  },

  reviewIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  reviewIcon: {
    fontSize: 25,
  },

  reviewTextBox: {
    flex: 1,
    gap: 5,
  },

  reviewTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.darkGreen,
  },

  reviewDescription: {
    fontSize: 11,
    color: '#7E8D7E',
    lineHeight: 16,
  },

  reviewArrow: {
    fontSize: 27,
    fontWeight: '600',
    color: COLORS.green,
  },

  // 높이를 줄인 보상 카드
  rewardCard: {
    backgroundColor: COLORS.cream,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 115,
    paddingVertical: 10,
    paddingHorizontal: 14,
    overflow: 'hidden',
  },

  rewardLeft: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },

  rewardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },

  coinIcon: {
    width: 27,
    height: 27,
  },

  rewardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.dark,
  },

  rewardLabel: {
    fontSize: 13,
    color: COLORS.brown,
  },

  rewardValue: {
    fontSize: 29,
    fontWeight: '900',
    color: COLORS.brown,
  },

  rewardNotice: {
    fontSize: 9,
    color: '#A08C75',
    textAlign: 'center',
  },

  rewardDivider: {
    width: 1,
    height: 72,
    backgroundColor: '#EAD7BB',
  },

  rewardBooks: {
    width: 112,
    height: 93,
    marginLeft: 8,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },

  homeButton: {
    flex: 1,
    backgroundColor: '#F0E3D3',
    borderRadius: 20,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  homeButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.brown,
  },

  continueButton: {
    flex: 1,
    backgroundColor: COLORS.darkGreen,
    borderRadius: 20,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  continueButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 7,
  },

  footerSprout: {
    width: 21,
    height: 21,
  },

  footerText: {
    fontSize: 11,
    color: '#9A938A',
  },
});
