import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  AuthApiError,
  requestPasswordReset,
} from '../../../api/authApi';

const GREEN = '#405F4B';
const BG = '#FAF7F1';

function showMessage(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
    return;
  }

  Alert.alert(title, message);
}

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    if (loading) return;

    if (!email.trim()) {
      showMessage('입력 확인', '가입한 이메일을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      await requestPasswordReset(email.trim());
      showMessage(
        '메일을 확인해주세요',
        '비밀번호 재설정 메일을 보냈습니다. 메일의 링크에서 새 비밀번호를 설정할 수 있습니다.'
      );
      router.back();
    } catch (error) {
      const message =
        error instanceof AuthApiError
          ? error.message
          : '재설정 메일을 보내지 못했습니다.';
      showMessage('요청 실패', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.title}>비밀번호 찾기</Text>
        <Text style={styles.hint}>
          가입한 이메일로 재설정 링크를 보냅니다.
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
        <TouchableOpacity
          style={styles.button}
          onPress={handleRequest}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>재설정 메일 보내기</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>로그인으로 돌아가기</Text>
        </TouchableOpacity>
      </View>
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
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: GREEN,
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
