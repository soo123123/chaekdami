
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';

import HomeScreen from '../screens/Home/HomeScreen';

import {
  getAccessToken,
  clearTokens,
} from '../utils/tokenStorage';

import {
  getMyInfo,
  AuthApiError,
} from '../api/authApi';

export default function HomePage() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const checkLogin = async () => {
      try {
        // 1. 저장된 Access Token 가져오기
        const token = await getAccessToken();

        if (!active) return;

        // 2. 토큰이 없다면 로그인 화면으로 이동
        if (!token) {
          router.replace('/auth/login');
          return;
        }

        // 3. 서버에 실제 로그인 상태 확인
        const user = await getMyInfo(token);

        if (!active) return;

        console.log('로그인 사용자 확인:', user);

        // 4. 서버 인증 성공
        setAuthenticated(true);
      } catch (error) {
        if (!active) return;

        console.error('인증 확인 실패:', error);

        if (
          error instanceof AuthApiError &&
          (error.status === 401 ||
            error.status === 403)
        ) {
          // 인증이 거부된 경우 토큰 삭제
          await clearTokens();

          if (!active) return;

          router.replace('/auth/login');
          return;
        }

        // 네트워크 오류 등은 인증 실패로 단정하지 않음
        setErrorMessage(
          '서버에 연결할 수 없습니다. 연결 상태를 확인한 후 다시 시도해주세요.'
        );
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    };

    checkLogin();

    return () => {
      active = false;
    };
  }, []);

  // 인증 확인 중
  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator
          size="large"
          color="#315E49"
        />

        <Text style={styles.message}>
          로그인 상태를 확인하고 있어요...
        </Text>
      </View>
    );
  }

  // 서버 연결 오류
  if (errorMessage) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>
          연결을 확인해주세요
        </Text>

        <Text style={styles.message}>
          {errorMessage}
        </Text>
      </View>
    );
  }

  // 인증되지 않은 사용자는 홈 화면을 표시하지 않음
  if (!authenticated) {
    return null;
  }

  // 인증된 사용자만 실제 FE2 홈 화면 표시
  return <HomeScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF7F1',
    padding: 24,
  },

  message: {
    marginTop: 16,
    fontSize: 14,
    color: '#315E49',
    textAlign: 'center',
    lineHeight: 22,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#315E49',
    textAlign: 'center',
  },
});
