import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { router } from 'expo-router';
import { getMyProfile } from '../../api/userApi';

interface UserProfile {
  id: number;
  email: string;
  nickname: string;
  role: string;

  // 백엔드 응답 확정 전 임시 선택 필드
  level?: number;
  experience?: number;
  currency?: number;
}

const MyPageScreen = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = async () => {
    try {
      setIsLoading(true);

      const data = await getMyProfile();

      setUser(data);
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);

      Alert.alert(
        '조회 실패',
        '사용자 정보를 불러오지 못했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          마이페이지를 불러오는 중...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* 상단 제목 */}
      <Text style={styles.title}>
        마이페이지
      </Text>

      {/* 프로필 영역 */}
      <View style={styles.profileCard}>
        <View style={styles.profileImage}>
          <Text style={styles.profileEmoji}>
            🐱
          </Text>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.nickname}>
            {user?.nickname ?? '책다듬이'}
          </Text>

          <Text style={styles.email}>
            {user?.email ?? ''}
          </Text>

          <Text style={styles.level}>
            Lv. {user?.level ?? 1}
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

      {/* 보상 정보 */}
      <View style={styles.rewardCard}>
        <TouchableOpacity
          style={styles.rewardItem}
          onPress={() => router.push('/reward')}
        >
          <Text style={styles.rewardIcon}>
            ⭐
          </Text>

          <Text style={styles.rewardValue}>
            Lv. {user?.level ?? 1}
          </Text>

          <Text style={styles.rewardLabel}>
            레벨
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.rewardItem}
          onPress={() => router.push('/reward')}
        >
          <Text style={styles.rewardIcon}>
            🔥
          </Text>

          <Text style={styles.rewardValue}>
            {user?.experience ?? 0}
          </Text>

          <Text style={styles.rewardLabel}>
            경험치
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.rewardItem}
          onPress={() => router.push('/shop')}
        >
          <Text style={styles.rewardIcon}>
            🪙
          </Text>

          <Text style={styles.rewardValue}>
            {user?.currency ?? 0}
          </Text>

          <Text style={styles.rewardLabel}>
            보유 재화
          </Text>
        </TouchableOpacity>
      </View>

      {/* 독서 활동 */}
      <Text style={styles.sectionTitle}>
        나의 독서 활동
      </Text>

      <View style={styles.menuCard}>
        <TouchableOpacity
          style={styles.menu}
          onPress={() =>
            router.push({
              pathname: '/sentences',
              params: {
                readingRecordId: '1',
              },
            })
          }
        >
          <Text style={styles.menuIcon}>📝</Text>

          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>
              문장 모음
            </Text>

            <Text style={styles.menuDescription}>
              저장한 문장을 확인해요
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menu}
          onPress={() => router.push('/quest')}
        >
          <Text style={styles.menuIcon}>🏅</Text>

          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>
              퀘스트
            </Text>

            <Text style={styles.menuDescription}>
              독서 퀘스트와 진행 상황을 확인해요
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menu}
          onPress={() => router.push('/shop')}
        >
          <Text style={styles.menuIcon}>🛍️</Text>

          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>
              상점
            </Text>

            <Text style={styles.menuDescription}>
              모은 재화로 아이템을 구매해요
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 기타 메뉴 */}
      <Text style={styles.sectionTitle}>
        설정
      </Text>

      <View style={styles.menuCard}>
        <TouchableOpacity
          style={styles.simpleMenu}
          onPress={() =>
            Alert.alert(
              '알림 설정',
              '알림 설정 기능은 추후 연결할 예정입니다.'
            )
          }
        >
          <Text style={styles.simpleMenuText}>
            알림 설정
          </Text>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.simpleMenu}
          onPress={() =>
            Alert.alert(
              '로그아웃',
              '로그아웃 기능은 인증 기능과 연결할 예정입니다.'
            )
          }
        >
          <Text style={styles.simpleMenuText}>
            로그아웃
          </Text>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
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
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
  },

  title: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
  },

  profileImage: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: '#f3eadb',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileEmoji: {
    fontSize: 34,
  },

  profileInfo: {
    flex: 1,
    marginLeft: 15,
  },

  nickname: {
    fontSize: 19,
    fontWeight: 'bold',
  },

  email: {
    fontSize: 13,
    marginTop: 4,
  },

  level: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 6,
  },

  editButton: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  editButtonText: {
    fontSize: 13,
  },

  rewardCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 25,
  },

  rewardItem: {
    flex: 1,
    alignItems: 'center',
  },

  rewardIcon: {
    fontSize: 22,
  },

  rewardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },

  rewardLabel: {
    fontSize: 12,
    marginTop: 3,
  },

  divider: {
    width: 1,
    backgroundColor: '#eeeeee',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 25,
    overflow: 'hidden',
  },

  menu: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },

  menuIcon: {
    fontSize: 23,
    marginRight: 14,
  },

  menuContent: {
    flex: 1,
  },

  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  menuDescription: {
    fontSize: 12,
    marginTop: 4,
  },

  arrow: {
    fontSize: 24,
  },

  simpleMenu: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 17,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },

  simpleMenuText: {
    fontSize: 15,
  },
});
