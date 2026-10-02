import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { router } from 'expo-router';
import { getMyProfile } from '../../api/userApi';

interface UserProfile {
  id?: number;
  nickname?: string;
  email?: string;
}

const MyPageScreen = () => {
  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  // 사용자 정보 불러오기
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getMyProfile();

        setProfile(data);
      } catch (error) {
        console.error(
          '사용자 정보 조회 실패:',
          error
        );

        // 백엔드 연결 전 테스트용 데이터
        setProfile({
          id: 1,
          nickname: '책다듬이',
          email: 'user@example.com',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  // 로딩 화면
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          사용자 정보를 불러오는 중...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* 상단 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
        >
          <Text style={styles.backButton}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          마이페이지
        </Text>

        <View style={styles.headerSpace} />
      </View>

      {/* 프로필 */}
      <View style={styles.profileCard}>
        <View style={styles.profileImage}>
          <Text style={styles.profileEmoji}>
            🐱
          </Text>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.nickname}>
            {profile?.nickname ?? '사용자'}
          </Text>

          <Text style={styles.email}>
            {profile?.email ?? ''}
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
          <Text style={styles.editButtonText}>
            수정
          </Text>
        </TouchableOpacity>
      </View>

      {/* 나의 독서 활동 */}
      <Text style={styles.sectionTitle}>
        나의 독서 활동
      </Text>

      {/* 독서 통계 */}
      <TouchableOpacity
        style={styles.menuCard}
        onPress={() =>
          router.push('/user/reading-stats')
        }
      >
        <View style={styles.menuIcon}>
          <Text style={styles.menuEmoji}>
            📊
          </Text>
        </View>

        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>
            독서 통계
          </Text>

          <Text style={styles.menuDescription}>
            나의 독서 시간과 기록을 확인해요.
          </Text>
        </View>

        <Text style={styles.arrow}>
          ›
        </Text>
      </TouchableOpacity>

      {/* D-day */}
      <TouchableOpacity
        style={styles.menuCard}
        onPress={() =>
          router.push('/reward/dday')
        }
      >
        <View style={styles.menuIcon}>
          <Text style={styles.menuEmoji}>
            📅
          </Text>
        </View>

        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>
            D-day
          </Text>

          <Text style={styles.menuDescription}>
            독서 목표 날짜를 확인해요.
          </Text>
        </View>

        <Text style={styles.arrow}>
          ›
        </Text>
      </TouchableOpacity>

      {/* 레벨 */}
      <TouchableOpacity
        style={styles.menuCard}
        onPress={() =>
          router.push('/reward/reward')
        }
      >
        <View style={styles.menuIcon}>
          <Text style={styles.menuEmoji}>
            ⭐
          </Text>
        </View>

        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>
            레벨
          </Text>

          <Text style={styles.menuDescription}>
            나의 레벨과 경험치를 확인해요.
          </Text>
        </View>

        <Text style={styles.arrow}>
          ›
        </Text>
      </TouchableOpacity>

      {/* 퀘스트 */}
      <TouchableOpacity
        style={styles.menuCard}
        onPress={() =>
          router.push('/reward/quest')
        }
      >
        <View style={styles.menuIcon}>
          <Text style={styles.menuEmoji}>
            🎯
          </Text>
        </View>

        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>
            퀘스트
          </Text>

          <Text style={styles.menuDescription}>
            독서 퀘스트와 진행 상황을 확인해요.
          </Text>
        </View>

        <Text style={styles.arrow}>
          ›
        </Text>
      </TouchableOpacity>

      {/* 상점 */}
      <TouchableOpacity
        style={styles.menuCard}
        onPress={() =>
          router.push('/reward/shop')
        }
      >
        <View style={styles.menuIcon}>
          <Text style={styles.menuEmoji}>
            🛒
          </Text>
        </View>

        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>
            상점
          </Text>

          <Text style={styles.menuDescription}>
            모은 재화로 아이템을 구매해요.
          </Text>
        </View>

        <Text style={styles.arrow}>
          ›
        </Text>
      </TouchableOpacity>

      {/* 계정 */}
      <Text style={styles.sectionTitle}>
        계정
      </Text>

      <View style={styles.menuGroup}>
        {/* 계정 정보 */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() =>
            Alert.alert(
              '계정 정보',
              '계정 정보 화면은 추후 연결할 예정입니다.'
            )
          }
        >
          <Text style={styles.rowIcon}>
            👤
          </Text>

          <Text style={styles.rowTitle}>
            계정 정보
          </Text>

          <Text style={styles.arrow}>
            ›
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* 알림 설정 */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() =>
            Alert.alert(
              '알림 설정',
              '알림 설정 기능은 추후 연결할 예정입니다.'
            )
          }
        >
          <Text style={styles.rowIcon}>
            🔔
          </Text>

          <Text style={styles.rowTitle}>
            알림 설정
          </Text>

          <Text style={styles.arrow}>
            ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* 기타 */}
      <Text style={styles.sectionTitle}>
        기타
      </Text>

      <View style={styles.menuGroup}>
        {/* 앱 정보 */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() =>
            Alert.alert(
              '앱 정보',
              '책다듬이 앱입니다.'
            )
          }
        >
          <Text style={styles.rowIcon}>
            ℹ️
          </Text>

          <Text style={styles.rowTitle}>
            앱 정보
          </Text>

          <Text style={styles.arrow}>
            ›
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* 로그아웃 */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() =>
            Alert.alert(
              '로그아웃',
              '로그아웃 기능은 백엔드 인증 연결 후 구현합니다.'
            )
          }
        >
          <Text style={styles.rowIcon}>
            🚪
          </Text>

          <Text style={styles.rowTitle}>
            로그아웃
          </Text>

          <Text style={styles.arrow}>
            ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* 개발 안내 */}
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>
          개발 중인 화면입니다.
        </Text>

        <Text style={styles.noticeText}>
          백엔드 연결 전에는 테스트용 사용자 정보가
          표시될 수 있습니다.
        </Text>
      </View>
    </ScrollView>
  );
};

export default MyPageScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8f3',
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#faf8f3',
  },

  loadingText: {
    marginTop: 10,
    color: '#777777',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  backButton: {
    fontSize: 34,
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
  },

  headerSpace: {
    width: 25,
  },

  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },

  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e9eee5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileEmoji: {
    fontSize: 30,
  },

  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },

  nickname: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  email: {
    fontSize: 11,
    color: '#888888',
    marginTop: 4,
  },

  editButton: {
    borderWidth: 1,
    borderColor: '#4f7658',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },

  editButtonText: {
    color: '#4f7658',
    fontSize: 12,
    fontWeight: 'bold',
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 11,
    marginTop: 5,
  },

  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#e9eee5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuEmoji: {
    fontSize: 23,
  },

  menuContent: {
    flex: 1,
    marginLeft: 13,
  },

  menuTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  menuDescription: {
    fontSize: 11,
    color: '#777777',
    marginTop: 4,
  },

  menuGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 17,
    marginBottom: 28,
  },

  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 17,
  },

  rowIcon: {
    fontSize: 19,
    width: 32,
  },

  rowTitle: {
    flex: 1,
    fontSize: 14,
  },

  divider: {
    height: 1,
    backgroundColor: '#eeeeee',
  },

  arrow: {
    fontSize: 24,
    color: '#888888',
  },

  notice: {
    backgroundColor: '#f0ede5',
    borderRadius: 15,
    padding: 16,
    marginTop: 5,
  },

  noticeTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },

  noticeText: {
    fontSize: 11,
    lineHeight: 17,
    color: '#777777',
    marginTop: 5,
  },
});
