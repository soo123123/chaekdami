
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import axios from 'axios';

import HomeScreen from '../features/fe2/screens/HomeScreen';

import {
  getAccessToken,
  clearTokensOf,
  getSessionId,
} from '../utils/tokenStorage';

import { getMyProfile } from '../features/fe2/api/userApi';

// 개발 중 홈 화면 UI 테스트를 위한 설정
// true: 개발 모드에서 로그인 없이 홈 화면 접근
// false: 개발 모드에서도 정상 로그인 인증 진행
const ENABLE_DEV_HOME_PREVIEW = true;

export default function HomePage() {
  const devPreviewEnabled =
    __DEV__ && ENABLE_DEV_HOME_PREVIEW;

  const [checking, setChecking] = useState<boolean>(
    !devPreviewEnabled
  );

  const [authenticated, setAuthenticated] =
    useState<boolean>(devPreviewEnabled);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  // 다시 시도를 누를 때마다 늘려 로그인 확인을 다시 실행한다
  const [attempt, setAttempt] = useState(0);

  const retry = () => {
    setErrorMessage(null);
    setChecking(true);
    setAttempt((current) => current + 1);
  };

  useEffect(() => {
    // 개발 모드 UI 미리보기에서는 인증 요청 생략
    if (devPreviewEnabled) {
      console.log(
        '[DEV] 로그인 없이 FE2 홈 화면 미리보기'
      );
      return;
    }

    let active = true;

    const checkLogin = async () => {
      const session = getSessionId();

      try {
        // 1. 저장된 Access Token 확인
        const token = await getAccessToken();

        if (!active) return;

        // 2. 토큰이 없다면 로그인 화면으로 이동
        if (!token) {
          router.replace('/auth/login');
          return;
        }

        // 3. 서버에 실제 로그인 상태 확인 (만료된 토큰은 apiClient가 재발급)
        await getMyProfile();

        if (!active) return;

        // 4. 서버 인증 성공
        setAuthenticated(true);
      } catch (error) {
        if (!active) return;

        console.error('인증 확인 실패:', error);

        if (
          axios.isAxiosError(error) &&
          (error.response?.status === 401 ||
            error.response?.status === 403)
        ) {
          // 세션이 이미 끝났거나 새로 로그인했으면 그 처리를 덮지 않는다
          if (await clearTokensOf(session)) {
            router.replace('/auth/login');
          }

          return;
        }

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
  }, [devPreviewEnabled, attempt]);

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

        <TouchableOpacity
          style={styles.retryButton}
          onPress={retry}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={styles.retryText}>
            다시 시도
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 인증되지 않은 사용자는 홈 화면 표시 안 함
  if (!authenticated) {
    return null;
  }

  // 실제 FE2 홈 화면
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

  retryButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 999,
    backgroundColor: '#315E49',
  },

  retryText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#315E49',
    textAlign: 'center',
  },
});
