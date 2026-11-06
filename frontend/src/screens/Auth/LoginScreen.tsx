
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

// 로그인 API
import { login, AuthApiError } from '../../api/authApi';

// 토큰 저장 함수
import { saveTokens } from '../../utils/tokenStorage';

// 색상
const GREEN = '#405F4B';
const DARK_GREEN = '#2E503D';
const BG = '#FAF7F1';
const BROWN = '#79654C';

// 로그인 일러스트
const IMAGES = {
  cat: require('../../../assets/images/login/login-cat-reading.png'),
  flowerLeft: require('../../../assets/images/login/login-flower-left.png'),
  flowerRight: require('../../../assets/images/login/login-flower-right.png'),
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // 웹과 모바일에서 알림 표시
  const showMessage = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // 실제 로그인 함수
  const handleLogin = async () => {
    if (loading) return;

    if (!email.trim() || !password.trim()) {
      showMessage(
        '입력 확인',
        '이메일과 비밀번호를 모두 입력해주세요.'
      );
      return;
    }

    setLoading(true);

    try {
      // 1. 백엔드 로그인 API 호출
      const response = await login({
        email: email.trim(),
        password,
      });

      // 2. 로그인 토큰 저장
      await saveTokens(
        response.accessToken,
        response.refreshToken
      );

      // 3. 로그인 성공 알림
   // 3. 로그인 성공 후 홈 화면으로 이동
       router.replace('/home');
      // 다음 단계에서 홈 화면 이동 추가

    } catch (error) {
      if (error instanceof AuthApiError) {
        if (
          error.status === 401 ||
          error.code === 'INVALID_CREDENTIALS'
        ) {
          showMessage(
            '로그인 실패',
            '이메일 또는 비밀번호를 확인해주세요.'
          );
        } else if (error.status === 429) {
          showMessage(
            '잠시 후 다시 시도해주세요',
            '로그인 요청이 너무 많습니다.'
          );
        } else {
          showMessage(
            '로그인 오류',
            error.message
          );
        }
      } else {
        showMessage(
          '오류 발생',
          '로그인 처리 중 문제가 발생했습니다.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* 앱 이름 */}
        <View style={styles.brand}>
          <Text style={styles.brandTitle}>
            책다듬이
          </Text>

          <Text style={styles.brandSubtitle}>
            책과 함께 성장하는 나의 하루
          </Text>
        </View>

        {/* 고양이 일러스트 */}
        <Image
          source={IMAGES.cat}
          style={styles.catImage}
          resizeMode="contain"
        />

        {/* 로그인 카드 */}
        <View style={styles.loginCard}>
          <Text style={styles.welcomeTitle}>
            다시 만나서 반가워요!
          </Text>

          <Text style={styles.welcomeSubtitle}>
            계정에 로그인하고 독서 기록을 이어가세요.
          </Text>

          {/* 이메일 */}
          <Text style={styles.label}>
            이메일
          </Text>

          <View style={styles.inputBox}>
            <Text style={styles.inputIcon}>✉</Text>

            <TextInput
              style={styles.input}
              placeholder="example@email.com"
              placeholderTextColor="#AAA49B"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />
          </View>

          {/* 비밀번호 */}
          <Text style={styles.label}>
            비밀번호
          </Text>

          <View style={styles.inputBox}>
            <Text style={styles.inputIcon}>♙</Text>

            <TextInput
              style={styles.input}
              placeholder="비밀번호를 입력해주세요"
              placeholderTextColor="#AAA49B"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />

            <TouchableOpacity
              onPress={() =>
                setShowPassword(!showPassword)
              }
            >
              <Text style={styles.showPassword}>
                {showPassword ? '숨기기' : '보기'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 로그인 버튼 */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              loading && styles.disabledButton,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>
                로그인
              </Text>
            )}
          </TouchableOpacity>

          {/* 하단 메뉴 */}
          <View style={styles.bottomLinks}>
            <Text style={styles.forgotPassword}>
              비밀번호를 잊으셨나요?
            </Text>

            <View style={styles.linkDivider} />

            <Text style={styles.signupText}>
              회원가입
            </Text>
          </View>
        </View>

        {/* 꽃 일러스트 */}
        <View style={styles.flowerArea}>
          <Image
            source={IMAGES.flowerLeft}
            style={styles.flower}
            resizeMode="contain"
          />

          <Image
            source={IMAGES.flowerRight}
            style={styles.flower}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.footerText}>
          🌱 오늘도 책과 함께하는 좋은 하루
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 35,
    paddingBottom: 35,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 35,
    fontWeight: '900',
    color: DARK_GREEN,
    letterSpacing: 1,
  },
  brandSubtitle: {
    marginTop: 8,
    fontSize: 13,
    color: BROWN,
  },
  catImage: {
    width: '100%',
    height: 205,
    alignSelf: 'center',
    marginBottom: -8,
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#EEE4D7',
    padding: 23,
  },
  welcomeTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: DARK_GREEN,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: '#80796F',
    lineHeight: 19,
    marginBottom: 25,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: DARK_GREEN,
    marginBottom: 10,
  },
  inputBox: {
    height: 51,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DED7C9',
    backgroundColor: '#FAF9F4',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    marginBottom: 22,
  },
  inputIcon: {
    fontSize: 19,
    color: '#8D8478',
    marginRight: 11,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#333333',
    paddingVertical: 0,
    minWidth: 0,
  },
  showPassword: {
    fontSize: 12,
    fontWeight: '700',
    color: GREEN,
    marginLeft: 8,
  },
  loginButton: {
    height: 53,
    borderRadius: 15,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 7,
  },
  disabledButton: {
    opacity: 0.65,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bottomLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 23,
  },
  forgotPassword: {
    fontSize: 12,
    color: '#827B70',
  },
  linkDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#D7D0C5',
  },
  signupText: {
    fontSize: 12,
    fontWeight: '800',
    color: GREEN,
  },
  flowerArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    height: 90,
  },
  flower: {
    width: 120,
    height: 90,
  },
  footerText: {
    textAlign: 'center',
    color: '#9A9386',
    fontSize: 11,
    marginTop: 8,
  },
});
