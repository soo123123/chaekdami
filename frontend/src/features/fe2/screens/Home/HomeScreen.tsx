
import React from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';

import { BottomTabBar } from '@/components/BottomTabBar';

const GREEN = '#315E49';
const BG = '#FAF7F1';

// 실제 frontend/assets/images 폴더 기준
const images = {
  banner: require('../../../../../assets/images/home/햇살 가득한 책 읽는 공간.png'),
  quest: require('../../../../../assets/images/home/quest-cat.png'),
  record: require('../../../../../assets/images/home/reading-record.png'),
  current: require('../../../../../assets/images/books/current-book.png'),
  recent1: require('../../../../../assets/images/books/recent-book-1.png'),
  recent2: require('../../../../../assets/images/books/recent-book-2.png'),
  recent3: require('../../../../../assets/images/books/recent-book-3.png'),
  recent4: require('../../../../../assets/images/books/recent-book-4.png'),
  recent5: require('../../../../../assets/images/books/recent-book-5.png'),
  recent6: require('../../../../../assets/images/books/recent-book-6.png'),
};

const recentBooks = [
  { title: '불편한 편의점', image: images.recent1 },
  { title: '작은 것들의 힘', image: images.recent2 },
  { title: '달의 조각', image: images.recent3 },
  {
    title: '우리가 빛의 속도로 갈 수 없다면',
    image: images.recent4,
  },
  { title: '내일도, 괜찮아', image: images.recent5 },
  { title: '하루의 온도', image: images.recent6 },
];

const questItems = [
  { title: '30분 이상 독서하기', completed: true },
  { title: '한 줄 독서 메모 작성하기', completed: false },
  { title: '오늘의 감정 기록하기', completed: false },
];

const recordItems = [
  { icon: '◷', value: '30분', label: '독서 시간' },
  { icon: '▤', value: '25쪽', label: '읽은 페이지' },
  { icon: '✎', value: '3개', label: '작성한 메모' },
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 600;

  const showMessage = (
    title: string,
    message: string
  ) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // FE1 기능은 추후 연결
  const handleStartReading = () => {
    showMessage(
      '독서 시작',
      'FE1 담당 독서 시작 화면과 연결할 예정입니다.'
    );
  };

  const handleLibrary = () => {
    showMessage(
      '나의 서재',
      'FE1 담당 나의 서재 화면과 연결할 예정입니다.'
    );
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
    <View style={styles.root}>
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
            >
              <Text style={styles.avatarText}>🐱</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* D-day / 보유 재화 / 레벨 */}
        <View style={styles.summaryRow}>
          {[
            {
              icon: '🗓️',
              value: 'D - 12',
              label: '목표까지 12일 남았어요!',
              onPress: goToDday,
            },
            {
              icon: '🪙',
              value: '1,250',
              label: '보유 재화',
              onPress: goToShop,
            },
            {
              icon: '🌱',
              value: 'Lv. 5',
              label: '다음 레벨까지 180 XP',
              onPress: goToLevel,
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.value}
              style={styles.summaryCard}
              onPress={item.onPress}
              activeOpacity={0.75}
            >
              <Text style={styles.summaryIcon}>
                {item.icon}
              </Text>

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

            <TouchableOpacity onPress={handleLibrary}>
              <Text style={styles.more}>더보기 ›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.currentBookRow}>
            <Image
              source={images.current}
              style={
                compact
                  ? styles.currentCoverCompact
                  : styles.currentCover
              }
              resizeMode="cover"
            />

            <View style={styles.currentInfo}>
              <Text style={styles.currentTitle}>
                여름의 빌라
              </Text>

              <Text style={styles.author}>
                백수린
              </Text>

              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <View style={styles.progressFill} />
                </View>

                <Text style={styles.progressText}>
                  45%
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
        </View>

        {/* 최근 읽은 책 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              최근 읽은 책
            </Text>

            <TouchableOpacity onPress={handleLibrary}>
              <Text style={styles.more}>더보기 ›</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {recentBooks.map((book, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recentBook}
                onPress={handleLibrary}
                activeOpacity={0.8}
              >
                <Image
                  source={book.image}
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
                        <Text style={styles.questCheck}>
                          ✓
                        </Text>
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
                    <Text style={styles.recordIcon}>
                      {item.icon}
                    </Text>

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
    </View>
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
  },

  avatarText: {
    fontSize: 22,
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
    fontSize: 25,
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

  questCheck: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 18,
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
    fontSize: 25,
    color: GREEN,
    marginBottom: 9,
    fontWeight: '600',
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
