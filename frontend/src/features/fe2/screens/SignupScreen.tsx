import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';

import {
  AuthApiError,
  login,
  signup,
} from '../../../api/authApi';
import { saveTokens } from '../../../utils/tokenStorage';

const GREEN = '#405F4B';
const BG = '#FAF7F1';

function showMessage(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
    return;
  }

  Alert.alert(title, message);
}

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (loading) return;

    if (!email.trim() || !nickname.trim() || !password) {
      showMessage('입력 확인', '이메일, 닉네임, 비밀번호를 모두 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      await signup({
        email: email.trim(),
        nickname: nickname.trim(),
        password,
      });

      const tokens = await login({
        email: email.trim(),
        password,
      });
      await saveTokens(tokens.accessToken, tokens.refreshToken);
      router.replace('/home');
    } catch (error) {
      const message =
        error instanceof AuthApiError
          ? error.message
          : '회원가입에 실패했습니다.';
      showMessage('회원가입 실패', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>회원가입</Text>
        <Text style={styles.hint}>
          닉네임은 2~16자입니다. 비밀번호는 8자 이상이며 대문자, 소문자, 숫자, 특수문자 중 2종류 이상을 포함해야 합니다.
        </Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="이메일"
          placeholderTextColor="#A3988C"
        />
        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholder="닉네임"
          placeholderTextColor="#A3988C"
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="비밀번호"
          placeholderTextColor="#A3988C"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>가입하고 시작하기</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>로그인으로 돌아가기</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 40,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: GREEN,
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6F675E',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7E0D6',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#29231F',
  },
  button: {
    marginTop: 8,
    backgroundColor: GREEN,
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backText: {
    marginTop: 8,
    textAlign: 'center',
    color: GREEN,
    fontSize: 14,
  },
});
