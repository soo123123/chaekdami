import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { getMyProfile } from '../../api/userApi';

interface UserProfile {
  id: number;
  email: string;
  nickname: string;
  role: string;
}

const MyPageScreen = ({ navigation }: any) => {
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
          사용자 정보를 불러오는 중...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>마이페이지</Text>

      <View style={styles.profileCard}>
        <Text style={styles.profileIcon}>👤</Text>

        <Text style={styles.nickname}>
          {user?.nickname ?? '사용자'}
        </Text>

        <Text style={styles.email}>
          {user?.email ?? ''}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.menu}
        onPress={() => navigation?.navigate('Sentence')}
      >
        <Text style={styles.menuText}>
          문장 모음
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menu}
        onPress={() => navigation?.navigate('Reward')}
      >
        <Text style={styles.menuText}>
          나의 보상
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menu}>
        <Text style={styles.menuText}>
          설정
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() =>
          Alert.alert(
            '로그아웃',
            '로그아웃 기능은 인증 기능과 연결할 예정입니다.'
          )
        }
      >
        <Text style={styles.logoutText}>
          로그아웃
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default MyPageScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
  },

  profileCard: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 25,
  },

  profileIcon: {
    fontSize: 45,
    marginBottom: 10,
  },

  nickname: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  email: {
    marginTop: 5,
    fontSize: 14,
  },

  menu: {
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
    paddingVertical: 16,
  },

  menuText: {
    fontSize: 16,
  },

  logoutButton: {
    marginTop: 30,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },

  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
