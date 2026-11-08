
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getRewardStatus } from '../../api/rewardApi';
type RewardStatus = {
  level?: number;
  xp?: number;
  requiredXp?: number;
  currency?: number;
};

type LevelInfo = {
  level: number;
  name: string;
  minXp: number;
  maxXp: number;
  image: any;
};

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
  catBooks: require('../../../../../assets/images/level/level-cat-books.png'),
  readingCat: require('../../../../../assets/images/level/level-reading-cat.png'),
  sproutBadge: require('../../../../../assets/images/level/level-sprout-badge.png'),
  seed: require('../../../../../assets/images/level/level-seed.png'),
  growingSprout: require('../../../../../assets/images/level/level-growing-sprout.png'),
  pottedSprout: require('../../../../../assets/images/level/level-potted-sprout.png'),
  youngTree: require('../../../../../assets/images/level/level-young-tree.png'),
  matureTree: require('../../../../../assets/images/level/level-mature-tree.png'),
  coin: require('../../../../../assets/images/level/level-coin.png'),
  book: require('../../../../../assets/images/level/level-open-book.png'),
  clock: require('../../../../../assets/images/level/level-clock.png'),
  calendar: require('../../../../../assets/images/level/level-calendar.png'),
};

const TEST_REWARD: RewardStatus = {
  level: 5,
  xp: 320,
  requiredXp: 640,
  currency: 1250,
};

const LEVELS: LevelInfo[] = [
  {
    level: 3,
    name: '싹틔우는 새싹',
    minXp: 0,
    maxXp: 159,
    image: ART.seed,
  },
  {
    level: 4,
    name: '성장하는 새싹',
    minXp: 160,
    maxXp: 319,
    image: ART.growingSprout,
  },
  {
    level: 5,
    name: '책읽는 새싹',
    minXp: 320,
    maxXp: 639,
    image: ART.pottedSprout,
  },
  {
    level: 6,
    name: '독서하는 나무',
    minXp: 640,
    maxXp: 1279,
    image: ART.youngTree,
  },
  {
    level: 7,
    name: '지혜로운 나무',
    minXp: 1280,
    maxXp: 2559,
    image: ART.matureTree,
  },
];

const BENEFITS = [
  {
    icon: 'leaf-outline' as const,
    title: 'Lv. 5 전용 프로필 배지',
    description: '특별한 배지로 독서 기록을 뽐내보세요!',
  },
  {
    icon: 'star-outline' as const,
    title: '보유 재화 +100개',
    description: '레벨 달성 축하 보상이 지급됩니다.',
  },
  {
    icon: 'color-palette-outline' as const,
    title: '서재 꾸미기 아이템 해금',
    description: '새로운 배경과 꾸미기 아이템을 사용할 수 있어요.',
  },
  {
    icon: 'stats-chart-outline' as const,
    title: '독서 통계 상세 기능 해금',
    description: '더 자세한 독서 통계를 확인할 수 있어요.',
  },
];

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

function LevelCard({
  item,
  currentLevel,
  cardWidth,
}: {
  item: LevelInfo;
  currentLevel: number;
  cardWidth: number;
}) {
  const current = item.level === currentLevel;
  const completed = item.level < currentLevel;

  return (
    <View
      style={[
        styles.levelCard,
        { width: cardWidth },
        current && styles.levelCardCurrent,
      ]}
    >
      <Image
        source={item.image}
        style={styles.levelImage}
        resizeMode="contain"
      />

      <Text style={styles.levelNumber}>
        Lv. {item.level}
      </Text>

      <Text
        style={styles.levelName}
        numberOfLines={2}
        adjustsFontSizeToFit
      >
        {item.name}
      </Text>

      <Text style={styles.levelRange} numberOfLines={2}>
        {item.minXp.toLocaleString()} ~{' '}
        {item.maxXp.toLocaleString()} exp
      </Text>

      <View style={styles.levelStatusArea}>
        {current ? (
          <View style={styles.currentLabel}>
            <Text style={styles.currentLabelText}>
              현재
            </Text>
          </View>
        ) : completed ? (
          <View style={styles.checkCircle}>
            <Ionicons
              name="checkmark"
              size={14}
              color="#FFFFFF"
            />
          </View>
        ) : (
          <Ionicons
            name="lock-closed-outline"
            size={19}
            color="#676763"
          />
        )}
      </View>
    </View>
  );
}

export default function RewardScreen() {
  const { width } = useWindowDimensions();

  const [reward, setReward] =
    useState<RewardStatus>(TEST_REWARD);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await getRewardStatus();

        if (active) {
          setReward(data);
          setDemo(false);
        }
      } catch (error) {
        console.warn('레벨 정보 조회 실패:', error);

        if (active) {
          setReward(TEST_REWARD);
          setDemo(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/fe2/user/mypage');
    }
  };

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

  const level = Math.max(1, reward.level ?? 5);
  const xp = Math.max(0, reward.xp ?? 0);
  const requiredXp = Math.max(
    1,
    reward.requiredXp ?? 640
  );

  const remainingXp = Math.max(0, requiredXp - xp);
  const progress = Math.min(
    100,
    (xp / requiredXp) * 100
  );

  const levelName =
    LEVELS.find((item) => item.level === level)?.name ??
    '꾸준한 독서가';

  const contentWidth = Math.min(width, 560);
  const panelInnerWidth = contentWidth - 28 - 26 - 2;
  const cardGap = 4;
  const levelCardWidth = Math.max(
    45,
    (panelInnerWidth - cardGap * 4) / 5
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={goBack}
            style={styles.backButton}
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
          >
            <Ionicons
              name="help-circle-outline"
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
                <Text style={styles.heroName}>
                  {levelName}
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
          </View>
        </View>

        {demo && (
          <Text style={styles.demoText}>
            서버 연결 전 예시 데이터를 표시하고 있어요.
          </Text>
        )}

        {/* 독서 활동 요약 */}
        <View style={styles.statsCard}>
          <StatItem
            image={ART.book}
            label="읽은 책"
            value="12권"
          />

          <View style={styles.statDivider} />

          <StatItem
            image={ART.clock}
            label="독서 시간"
            value="18시간 40분"
          />

          <View style={styles.statDivider} />

          <StatItem
            image={ART.calendar}
            label="연속 독서"
            value="12일"
          />
        </View>

        {/* 레벨 정보 및 혜택 */}
        <View style={styles.mainPanel}>
          <Text style={styles.sectionTitle}>
            레벨 정보
          </Text>

          <View style={styles.levelList}>
            {LEVELS.map((item) => (
              <LevelCard
                key={item.level}
                item={item}
                currentLevel={level}
                cardWidth={levelCardWidth}
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>
            레벨 혜택
          </Text>

          <View style={styles.benefits}>
            {BENEFITS.map((benefit, index) => (
              <View
                key={benefit.title}
                style={[
                  styles.benefitRow,
                  index === 0 && styles.benefitRowFirst,
                ]}
              >
                <View style={styles.benefitIconBox}>
                  <Ionicons
                    name={benefit.icon}
                    size={24}
                    color={COLORS.green}
                  />
                </View>

                <View style={styles.benefitText}>
                  <Text style={styles.benefitTitle}>
                    {benefit.title}
                  </Text>
                  <Text style={styles.benefitDescription}>
                    {benefit.description}
                  </Text>
                </View>

                <View style={styles.benefitCheck}>
                  <Ionicons
                    name="checkmark"
                    size={17}
                    color="#FFFFFF"
                  />
                </View>
              </View>
            ))}
          </View>

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
            재화 상점 가기 ›
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
    height: 37,
  },
  backButton: {
    width: 40,
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
  heroName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.green,
    marginTop: 8,
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
  demoText: {
    fontSize: 10,
    color: COLORS.muted,
    marginBottom: 11,
    marginLeft: 4,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    marginHorizontal: 3,
    marginBottom: 19,
  },
  levelList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    marginBottom: 30,
  },
  levelCard: {
    minHeight: 198,
    borderWidth: 1,
    borderColor: '#ECE6E0',
    backgroundColor: '#FCF9F6',
    borderRadius: 13,
    paddingHorizontal: 2,
    paddingVertical: 10,
    alignItems: 'center',
  },
  levelCardCurrent: {
    borderWidth: 2,
    borderColor: COLORS.green,
    backgroundColor: '#F2F7F0',
  },
  levelImage: {
    width: '100%',
    height: 65,
    marginBottom: 7,
  },
  levelNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  levelName: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 6,
    minHeight: 25,
  },
  levelRange: {
    fontSize: 7,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 5,
    minHeight: 20,
  },
  levelStatusArea: {
    marginTop: 'auto',
    paddingTop: 7,
    height: 31,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLabel: {
    backgroundColor: COLORS.green,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  currentLabelText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefits: {
    marginBottom: 24,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 75,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 12,
  },
  benefitRowFirst: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  benefitIconBox: {
    width: 47,
    height: 47,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#EEE7DF',
    backgroundColor: '#F8F3ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
  },
  benefitDescription: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 5,
    lineHeight: 16,
  },
  benefitCheck: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 9,
  },
  cheerCard: {
    backgroundColor: COLORS.cream,
    borderRadius: 20,
    minHeight: 153,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cheerCat: {
    width: 142,
    height: 145,
    marginLeft: -12,
  },
  cheerInformation: {
    flex: 1,
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
