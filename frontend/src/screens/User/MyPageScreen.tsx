import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { getMyProfile } from '../../api/userApi';

interface UserProfile {
  id?: number;
  nickname?: string;
  email?: string;
}

const MyPageScreen = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 임시 데이터
  const level = 5;
  const xp = 320;
  const maxXp = 500;
  const currency = 1250;

  const xpPercent = Math.min((xp / maxXp) * 100, 100);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getMyProfile();
        setProfile(data);
      } catch (error) {
        console.log('사용자 정보 조회 실패:', error);

        // 백엔드 연결 전 임시 데이터
        setProfile({
          id: 1,
          nickname: '책다듬이',
          email: 'user@example.com',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 상단 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>마이페이지</Text>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={() =>
              Alert.alert(
                '설정',
                '설정 기능은 추후 연결할 예정입니다.'
              )
            }
          >
            <Text style={styles.settingIcon}>⚙</Text>
          </TouchableOpacity>
        </View>

        {/* 프로필 */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>🌱</Text>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.nickname}>
                {profile?.nickname ?? '사용자'}
              </Text>

              <Text style={styles.email}>
                {profile?.email ?? ''}
              </Text>

              <Text style={styles.profileMessage}>
                오늘도 책과 함께 성장해요.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() =>
                Alert.alert(
                  '프로필 수정',
                  '프로필 수정 기능은 추후 연결할 예정입니다.'
                )
              }
            >
              <Text style={styles.editButtonText}>수정</Text>
            </TouchableOpacity>
          </View>

          {/* 레벨 */}
          <TouchableOpacity
            style={styles.levelArea}
            onPress={() => router.push('/reward/reward')}
          >
            <View style={styles.levelHeader}>
              <Text style={styles.levelText}>
                Lv. {level}
              </Text>

              <Text style={styles.xpText}>
                {xp} / {maxXp} XP
              </Text>
            </View>

            <View style={styles.progressBackground}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${xpPercent}%` },
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* 활동 정보 */}
        <View style={styles.statCard}>
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => router.push('/reward/reward')}
          >
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statValue}>Lv.{level}</Text>
            <Text style={styles.statLabel}>레벨</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🪙</Text>
            <Text style={styles.statValue}>{currency}</Text>
            <Text style={styles.statLabel}>보유 재화</Text>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.statItem}
            onPress={() => router.push('/user/reading-stats')}
          >
            <Text style={styles.statEmoji}>📚</Text>
            <Text style={styles.statValue}>3권</Text>
            <Text style={styles.statLabel}>완독</Text>
          </TouchableOpacity>
        </View>

        {/* 독서 목표 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>나의 독서 활동</Text>
        </View>

        <TouchableOpacity
          style={styles.ddayCard}
          onPress={() => router.push('/reward/dday')}
        >
          <View style={styles.ddayLeft}>
            <View style={styles.ddayBadge}>
              <Text style={styles.ddayBadgeText}>D-10</Text>
            </View>

            <View>
              <Text style={styles.cardTitle}>
                현재 읽는 책 완독하기
              </Text>

              <Text style={styles.cardDescription}>
                목표일까지 꾸준히 읽어보세요.
              </Text>
            </View>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* 퀘스트 */}
        <TouchableOpacity
          style={styles.questCard}
          onPress={() => router.push('/reward/quest')}
        >
          <View style={styles.questHeader}>
            <View>
              <Text style={styles.cardTitle}>
                오늘의 독서 퀘스트
              </Text>

              <Text style={styles.cardDescription}>
                오늘 30분 독서하기
              </Text>
            </View>

            <Text style={styles.questProgress}>20 / 30분</Text>
          </View>

          <View style={styles.questProgressBackground}>
            <View
              style={[
                styles.questProgressBar,
                { width: '67%' },
              ]}
            />
          </View>

          <View style={styles.questReward}>
            <Text style={styles.rewardText}>
              ⭐ 50 XP
            </Text>

            <Text style={styles.rewardText}>
              🪙 20
            </Text>
          </View>
        </TouchableOpacity>

        {/* 나의 서재 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>나의 서재</Text>

          <TouchableOpacity
            onPress={() => router.push('/reward/shop')}
          >
            <Text style={styles.moreText}>꾸미기 ›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.libraryCard}>
          <View style={styles.libraryPreview}>
            <Text style={styles.libraryEmoji}>🪴</Text>
            <Text style={styles.libraryEmoji}>📚</Text>
            <Text style={styles.libraryEmoji}>🪑</Text>
            <Text style={styles.libraryEmoji}>💡</Text>
          </View>

          <Text style={styles.libraryTitle}>
            나만의 독서 공간
          </Text>

          <Text style={styles.libraryDescription}>
            독서 활동으로 모은 재화로 서재를 꾸며보세요.
          </Text>

          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/reward/shop')}
          >
            <Text style={styles.shopButtonText}>
              상점 보러가기
            </Text>
          </TouchableOpacity>
        </View>

        {/* 메뉴 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>독서 기록</Text>
        </View>

        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push('/user/reading-stats')}
        >
          <View style={styles.menuLeft}>
            <Text style={styles.menuEmoji}>📊</Text>

            <View>
              <Text style={styles.menuTitle}>독서 통계</Text>
              <Text style={styles.menuDescription}>
                나의 독서 활동을 확인해요.
              </Text>
            </View>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push('/reward/quest')}
        >
          <View style={styles.menuLeft}>
            <Text style={styles.menuEmoji}>🎯</Text>

            <View>
              <Text style={styles.menuTitle}>퀘스트</Text>
              <Text style={styles.menuDescription}>
                독서 목표와 진행 상황을 확인해요.
              </Text>
            </View>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push('/reward/shop')}
        >
          <View style={styles.menuLeft}>
            <Text style={styles.menuEmoji}>🛍️</Text>

            <View>
              <Text style={styles.menuTitle}>상점</Text>
              <Text style={styles.menuDescription}>
                재화로 서재 아이템을 구매해요.
              </Text>
            </View>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

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
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default MyPageScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F0',
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F6F0',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
  },

  settingButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingIcon: {
    fontSize: 20,
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 14,
  },

  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E8EEE4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarEmoji: {
    fontSize: 34,
  },

  profileInfo: {
    flex: 1,
    marginLeft: 15,
  },

  nickname: {
    fontSize: 20,
    fontWeight: '800',
  },

  email: {
    fontSize: 12,
    color: '#999999',
    marginTop: 3,
  },

  profileMessage: {
    fontSize: 13,
    color: '#777777',
    marginTop: 6,
  },

  editButton: {
    borderWidth: 1,
    borderColor: '#D7DDD3',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  editButtonText: {
    fontSize: 12,
    color: '#55705A',
  },

  levelArea: {
    marginTop: 20,
  },

  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  levelText: {
    fontWeight: '700',
    color: '#49634E',
  },

  xpText: {
    fontSize: 12,
    color: '#777777',
  },

  progressBackground: {
    height: 9,
    backgroundColor: '#E8E8E8',
    borderRadius: 10,
    overflow: 'hidden',
  },

  progressBar: {
    height: '100%',
    backgroundColor: '#5E7D61',
    borderRadius: 10,
  },

  statCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 18,
    marginBottom: 26,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statEmoji: {
    fontSize: 20,
  },

  statValue: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 5,
  },

  statLabel: {
    fontSize: 11,
    color: '#888888',
    marginTop: 3,
  },

  divider: {
    width: 1,
    backgroundColor: '#EEEEEE',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
  },

  moreText: {
    color: '#55705A',
    fontWeight: '600',
  },

  ddayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  ddayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  ddayBadge: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#E8EEE4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  ddayBadgeText: {
    color: '#4F6C53',
    fontWeight: '800',
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },

  cardDescription: {
    fontSize: 12,
    color: '#888888',
    marginTop: 5,
  },

  arrow: {
    fontSize: 25,
    color: '#888888',
  },

  questCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 25,
  },

  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  questProgress: {
    fontSize: 12,
    fontWeight: '700',
    color: '#55705A',
  },

  questProgressBackground: {
    height: 8,
    backgroundColor: '#EEEEEE',
    borderRadius: 10,
    marginTop: 15,
    overflow: 'hidden',
  },

  questProgressBar: {
    height: '100%',
    backgroundColor: '#5E7D61',
  },

  questReward: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 15,
    marginTop: 10,
  },

  rewardText: {
    fontSize: 12,
    fontWeight: '700',
  },

  libraryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 26,
  },

  libraryPreview: {
    height: 110,
    borderRadius: 16,
    backgroundColor: '#EEE9DF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginBottom: 15,
  },

  libraryEmoji: {
    fontSize: 34,
  },

  libraryTitle: {
    fontSize: 16,
    fontWeight: '800',
  },

  libraryDescription: {
    fontSize: 12,
    color: '#888888',
    marginTop: 5,
  },

  shopButton: {
    backgroundColor: '#5E7D61',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 15,
  },

  shopButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 17,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuEmoji: {
    fontSize: 24,
    marginRight: 14,
  },

  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
  },

  menuDescription: {
    fontSize: 11,
    color: '#888888',
    marginTop: 4,
  },

  logoutButton: {
    marginTop: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },

  logoutText: {
    color: '#999999',
    fontSize: 13,
  },
});