import {
  router,
  useLocalSearchParams,
} from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

import { createReview } from '../../api/reviewApi';

const ReviewWriteScreen = () => {
  const params = useLocalSearchParams<{
    readingRecordId?: string;
  }>();

  const readingRecordId =
    Number(params.readingRecordId) || 1;
  const readingRecordId = route?.params?.readingRecordId ?? 1;

  const [rating, setRating] = useState('');
  const [oneLine, setOneLine] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    // 독후감 입력 확인
    if (!content.trim()) {
      Alert.alert('알림', '독후감을 작성해주세요.');
      return;
    }

    // 평점 숫자 변환
    const ratingNumber = Number(rating);

    // 평점 범위 확인
    if (
      !Number.isInteger(ratingNumber) ||
      ratingNumber < 1 ||
      ratingNumber > 5
    ) {
      Alert.alert('알림', '평점은 1~5 사이의 숫자로 입력해주세요.');
      return;
    }

    try {
      setIsSaving(true);

      await createReview(
        readingRecordId,
        content,
        ratingNumber,
        oneLine
      );

      Alert.alert(
        '저장 완료',
        '독후감이 저장되었습니다.',
        [
          {
            text: '확인',
            onPress: () =>router.back()
          },
        ]
      );
    } catch (error) {
      console.error('독후감 저장 실패:', error);

      Alert.alert(
        '저장 실패',
        '독후감을 저장하지 못했습니다.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>독후감 작성</Text>

      <Text style={styles.label}>평점</Text>

      <TextInput
        style={styles.input}
        value={rating}
        onChangeText={setRating}
        placeholder="1~5점"
        keyboardType="numeric"
      />

      <Text style={styles.label}>한줄평</Text>

      <TextInput
        style={styles.input}
        value={oneLine}
        onChangeText={setOneLine}
        placeholder="책에 대한 한줄평을 작성하세요."
      />

      <Text style={styles.label}>독후감</Text>

      <TextInput
        style={styles.contentInput}
        value={content}
        onChangeText={setContent}
        placeholder="책을 읽고 느낀 점을 작성하세요."
        multiline
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Text style={styles.buttonText}>
          {isSaving ? '저장 중...' : '독후감 저장'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ReviewWriteScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
  },

  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },

  contentInput: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    padding: 12,
    height: 180,
    textAlignVertical: 'top',
    marginBottom: 20,
  },

  button: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },

  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
