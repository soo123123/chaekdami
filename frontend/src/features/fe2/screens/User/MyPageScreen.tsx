
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getMyProfile } from '../../api/userApi';
import { BottomTabBar } from '@/components/BottomTabBar';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface UserProfile {
  id?: number;
  nickname?: string;
  email?: string;
}

const COLORS = {
  background: '#FAF7F1',
  white: '#FFFDF9',
  green: '#365F49',
  darkGreen: '#274B3B',
  muted: '#77736C',
  text: '#29231F',
  line: '#EBE5DB',
};

const DATA = {
  level: 5,
  xp: 320,
  maxXp: 640,
  currency: 1250,
  dday: 12,
  questMinutes: 0,
  questTarget: 30,
};

// 이미지 경로: frontend/assets/images/mypage/
const ART = {
  profileBanner: require('../../../../../assets/images/mypage/profile-banner.png'),
  profileCat: require('../../../../../assets/images/mypage/profile-cat.png'),
  questBanner: require('../../../../../assets/images/mypage/quest-banner.png'),
  questCat: require('../../../../../assets/images/mypage/quest-cat.png'),
  bookshelf: require('../../../../../assets/images/mypage/bookshelf.png'),
  bookPlant: require('../../../../../assets/images/mypage/book-plant.png'),
  coin: require('../../../../../assets/images/mypage/coin-icon.png'),
  level: require('../../../../../assets/images/mypage/level-icon.png'),
  decoration: require('../../../../../assets/images/mypage/decoration-icon.png'),
  stats: require('../../../../../assets/images/mypage/stats-icon.png'),
  bell: require('../../../../../assets/images/mypage/notification-bell.png'),
  settings: require('../../../../../assets/images/mypage/settings-gear.png'),
  readingCat: require('../../../../../assets/images/mypage/reading-cat.png'),
  sleepingCat: require('../../../../../assets/images/mypage/sleeping-cat.png'),
};

function goTo(path: string) {
  router.push(path as any);
}

function pending(name: string) {
  Alert.alert('안내', `${name} 기능은 연결 준비 중입니다.`);
}

export default function MyPageScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const { width } = useWindowDimensions();
  const compact = width < 410;

  const xpPercent = Math.min(
    100,
    (DATA.xp / DATA.maxXp) * 100
  );

  const questPercent = Math.min(
    100,
    (DATA.questMinutes / DATA.questTarget) * 100
  );

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const data = await getMyProfile();

        if (active) {
          setProfile(data);
        }
      } catch (error) {
        console.log('사용자 정보 조회 실패:', error);

        if (active) {
          setProfile({
            id: 1,
            nickname: '책읽는고양이',
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color={COLORS.green}
        />
        <Text style={styles.loadingText}>
          마이페이지를 불러오는 중...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* 프로필 배너 */}
        <ImageBackground
          source={ART.profileBanner}
          resizeMode="cover"
          imageStyle={styles.heroBackground}
          style={styles.hero}
        >
          <View style={styles.heroHeader}>
            <Text style={styles.heroTitle}>
              마이페이지
            </Text>

            <View style={styles.heroActions}>
              <TouchableOpacity
                onPress={() => pending('알림')}
                accessibilityLabel="알림"
              >
                <Image
                  source={ART.bell}
                  style={styles.headerIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => pending('설정')}
                accessibilityLabel="설정"
              >
                <Image
                  source={ART.settings}
                  style={styles.headerIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* 프로필 정보 */}
          <View style={styles.profileRow}>
            <TouchableOpacity
              style={styles.avatar}
              onPress={() => pending('프로필 수정')}
            >
              <Image
                source={ART.profileCat}
                style={styles.avatarImage}
                resizeMode="contain"
              />

              <View style={styles.editDot}>
                <Ionicons
                  name="pencil"
                  size={11}
                  color="#FFFFFF"
                />
              </View>
            </TouchableOpacity>

            <View style={styles.profileDetails}>
              <Text
                style={styles.nickname}
                numberOfLines={1}
              >
                {profile?.nickname || '책읽는고양이'}
              </Text>

              <Text
                style={styles.quote}
                numberOfLines={2}
              >
                조금씩, 꾸준히. 그게 큰 변화를 만들어요.
              </Text>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => pending('프로필 수정')}
              >
                <Text style={styles.editButtonText}>
                  프로필 편집
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={13}
                  color={COLORS.muted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <Image
            source={ART.bookPlant}
            style={styles.heroPlant}
            resizeMode="contain"
          />
        </ImageBackground>

        {/* D-day, 레벨, 재화 */}
        <View style={styles.summary}>
          <TouchableOpacity
            style={styles.summaryItem}
            onPress={() => goTo('/fe2/reward/dday')}
          >
            <Image
              source={ART.readingCat}
              style={styles.summaryArt}
              resizeMode="contain"
            />

            <Text style={styles.summaryLabel}>
              독서 D-day
            </Text>

            <Text style={styles.summaryValue}>
              {DATA.dday}일
            </Text>

            <Text
              style={styles.summaryHint}
              numberOfLines={2}
            >
              꾸준히 읽고 있어요!
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.summaryItem}
            onPress={() => goTo('/fe2/reward/reward')}
          >
            <Image
              source={ART.level}
              style={styles.summaryArt}
              resizeMode="contain"
            />

            <Text style={styles.summaryLabel}>
              나의 레벨
            </Text>

            <Text style={styles.summaryValue}>
              Lv. {DATA.level}
            </Text>

            <View style={styles.miniTrack}>
              <View
                style={[
                  styles.miniFill,
                  { width: `${xpPercent}%` },
                ]}
              />
            </View>

            <Text
              style={styles.summaryHint}
              numberOfLines={2}
            >
              다음 레벨까지 {DATA.maxXp - DATA.xp} XP
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.summaryItem}
            onPress={() => goTo('/fe2/reward/shop')}
          >
            <Image
              source={ART.coin}
              style={styles.summaryArt}
              resizeMode="contain"
            />

            <Text style={styles.summaryLabel}>
              보유 재화
            </Text>

            <Text style={styles.summaryValue}>
              {DATA.currency.toLocaleString()}
            </Text>

            <Text
              style={styles.summaryHint}
              numberOfLines={2}
            >
              상점에서 사용해요
            </Text>
          </TouchableOpacity>
        </View>

        {/* 오늘의 퀘스트 */}
        <TouchableOpacity
          style={styles.quest}
          onPress={() => goTo('/fe2/reward/quest')}
        >
          <ImageBackground
            source={ART.questBanner}
            resizeMode="cover"
            imageStyle={styles.questBackgroundImage}
            style={styles.questBackground}
          >
            <Image
              source={ART.questCat}
              style={styles.questCat}
              resizeMode="contain"
            />

            <View style={styles.questInfo}>
              <Text style={styles.questTitle}>
                오늘의 퀘스트
              </Text>

              <Text style={styles.questDescription}>
                30분 이상 독서하기
              </Text>

              <View style={styles.questProgressRow}>
                <View style={styles.questTrack}>
                  <View
                    style={[
                      styles.questFill,
                      { width: `${questPercent}%` },
                    ]}
                  />
                </View>

                <Text style={styles.questCount}>
                  {DATA.questMinutes}/{DATA.questTarget}분
                </Text>
              </View>
            </View>

            <View style={styles.questArrow}>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={COLORS.green}
              />
            </View>
          </ImageBackground>
        </TouchableOpacity>

        {/* 바로가기 */}
        <View style={styles.shortcuts}>
          <Shortcut
            title="재화 상점"
            subtitle="아이템 구매"
            image={ART.coin}
            tint="#FFF1E4"
            compact={compact}
            onPress={() => goTo('/fe2/reward/shop')}
          />

          <Shortcut
            title="서재 꾸미기"
            subtitle="나만의 공간"
            image={ART.decoration}
            tint="#F4EFE2"
            compact={compact}
            onPress={() => goTo('/fe2/reward/shop')}
          />

          <Shortcut
            title="레벨 혜택"
            subtitle="성장 기록"
            image={ART.level}
            tint="#F0F3E8"
            compact={compact}
            onPress={() => goTo('/fe2/reward/reward')}
          />

          <Shortcut
            title="독서 통계"
            subtitle="독서 분석"
            image={ART.stats}
            tint="#E9F2EC"
            compact={compact}
            onPress={() => goTo('/fe2/user/reading-stats')}
          />
        </View>

        {/* 나의 서재 */}
        <View style={styles.libraryCard}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>
              나의 서재 미리보기
            </Text>

            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => goTo('/reading/library')}
            >
              <Text style={styles.moreText}>
                전체보기
              </Text>

              <Ionicons
                name="chevron-forward"
                size={15}
                color={COLORS.muted}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.libraryPreview}
            onPress={() => goTo('/reading/library')}
          >
            <Image
              source={ART.bookshelf}
              style={styles.bookshelfImage}
              resizeMode="contain"
            />

            <Image
              source={ART.sleepingCat}
              style={styles.shelfCat}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* 설정 */}
        <View style={styles.settingsCard}>
          <SettingsRow
            icon="person-outline"
            title="계정 정보"
            onPress={() => pending('계정 정보')}
          />

          <SettingsRow
            icon="notifications-outline"
            title="알림 설정"
            onPress={() => pending('알림 설정')}
          />

          <SettingsRow
            icon="help-circle-outline"
            title="고객센터"
            onPress={() => pending('고객센터')}
          />

          <SettingsRow
            icon="document-text-outline"
            title="이용약관 및 정책"
            last
            onPress={() => pending('이용약관 및 정책')}
          />
        </View>

        {/* 로그아웃 */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() =>
            Alert.alert(
              '로그아웃',
              '로그아웃 기능은 백엔드 인증 연결 후 구현합니다.'
            )
          }
        >
          <Ionicons
            name="log-out-outline"
            size={18}
            color={COLORS.muted}
          />

          <Text style={styles.logoutText}>
            로그아웃
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 공용 하단 탭바 (FE1 서재와 동일) */}
      <BottomTabBar active="mypage" />
    </View>
  );
}

function Shortcut({
  title,
  subtitle,
  image,
  tint,
  compact,
  onPress,
}: {
  title: string;
  subtitle: string;
  image: any;
  tint: string;
  compact: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.shortcut}
      onPress={onPress}
    >
      <View
        style={[
          styles.shortcutArtBox,
          { backgroundColor: tint },
        ]}
      >
        <Image
          source={image}
          style={styles.shortcutArt}
          resizeMode="contain"
        />
      </View>

      <Text
        style={[
          styles.shortcutTitle,
          compact && styles.shortcutTitleCompact,
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>

      <Text
        style={styles.shortcutSubtitle}
        numberOfLines={1}
      >
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

function SettingsRow({
  icon,
  title,
  onPress,
  last = false,
}: {
  icon: IconName;
  title: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.settingsRow,
        last && styles.lastRow,
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={20}
        color={COLORS.green}
      />

      <Text style={styles.settingsText}>
        {title}
      </Text>

      <Ionicons
        name="chevron-forward"
        size={17}
        color={COLORS.muted}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  content: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 28,
  },
  hero: {
    height: 205,
    borderRadius: 23,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 12,
    backgroundColor: '#F0E5D5',
  },
  heroBackground: {
    borderRadius: 23,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 25,
    height: 25,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 11,
    zIndex: 2,
    paddingRight: 24,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 40,
    backgroundColor: '#FFF9EF',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarImage: {
    width: 65,
    height: 65,
  },
  editDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileDetails: {
    flex: 1,
    minWidth: 0,
  },
  nickname: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  quote: {
    fontSize: 10,
    color: '#4E4942',
    marginTop: 5,
    lineHeight: 15,
  },
  editButton: {
    marginTop: 9,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 11,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  editButtonText: {
    fontSize: 10,
    color: '#625B51',
    fontWeight: '600',
  },
  heroPlant: {
    position: 'absolute',
    width: 90,
    height: 92,
    right: -12,
    bottom: -13,
    opacity: 0.8,
  },
  summary: {
    backgroundColor: '#EFF1E9',
    borderRadius: 22,
    flexDirection: 'row',
    gap: 5,
    padding: 6,
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    minWidth: 0,
    minHeight: 127,
    backgroundColor: COLORS.white,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 3,
  },
  summaryArt: {
    width: 36,
    height: 36,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 10,
    color: COLORS.muted,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.green,
    marginTop: 4,
    textAlign: 'center',
  },
  summaryHint: {
    fontSize: 9,
    color: COLORS.muted,
    marginTop: 5,
    textAlign: 'center',
    lineHeight: 12,
  },
  miniTrack: {
    width: '76%',
    height: 4,
    backgroundColor: '#E3E7E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 5,
  },
  miniFill: {
    height: '100%',
    backgroundColor: COLORS.green,
  },
  quest: {
    marginBottom: 12,
    borderRadius: 21,
    overflow: 'hidden',
    backgroundColor: COLORS.green,
  },
  questBackground: {
    minHeight: 116,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  questBackgroundImage: {
    borderRadius: 21,
  },
  questCat: {
    width: 76,
    height: 84,
    flexShrink: 0,
  },
  questInfo: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 7,
  },
  questTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  questDescription: {
    fontSize: 11,
    color: '#F0F6EE',
    marginTop: 6,
  },
  questProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  questTrack: {
    flex: 1,
    height: 7,
    backgroundColor: '#9AB2A1',
    borderRadius: 5,
    overflow: 'hidden',
  },
  questFill: {
    height: '100%',
    backgroundColor: '#F6F0D8',
  },
  questCount: {
    fontSize: 9,
    color: '#FFFFFF',
  },
  questArrow: {
    backgroundColor: '#FFFFFF',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 3,
  },
  shortcuts: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  shortcut: {
    flex: 1,
    minWidth: 0,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    alignItems: 'center',
    paddingHorizontal: 3,
    paddingVertical: 9,
  },
  shortcutArtBox: {
    width: '100%',
    height: 57,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 7,
  },
  shortcutArt: {
    width: 43,
    height: 43,
  },
  shortcutTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  shortcutTitleCompact: {
    fontSize: 10,
  },
  shortcutSubtitle: {
    fontSize: 9,
    color: COLORS.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  libraryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 21,
    padding: 14,
    marginBottom: 12,
  },
  sectionHeading: {
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
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreText: {
    fontSize: 11,
    color: COLORS.muted,
  },
  libraryPreview: {
    height: 168,
    backgroundColor: '#F2E8D9',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bookshelfImage: {
    width: '94%',
    height: '94%',
  },
  shelfCat: {
    position: 'absolute',
    right: 6,
    bottom: 5,
    width: 66,
    height: 66,
  },
  settingsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 21,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  settingsRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  settingsText: {
    flex: 1,
    fontSize: 13,
    color: '#56534D',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    paddingVertical: 14,
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  logoutText: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: '700',
  },
});
