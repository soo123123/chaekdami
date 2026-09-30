import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';
import { createReview } from '../../api/reviewApi';

const ReviewWriteScreen = () => {
  const params =
    useLocalSearchParams<{ readingRecordId?: string }>();

  // FE1의 독서 기록 화면에서 전달받을 값
  // 전달되지 않았을 때는 개발 테스트용으로 1 사용
  const readingRecordId =
    Number(params.readingRecordId) || 1;

  const [rating, setRating] = useState(0);
  const [oneLine, setOneLine] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (rating === 0) {
      Alert.alert(
        '알림',
        '별점을 선택해주세요.'
      );
      return;
    }

    if (!content.trim()) {
      Alert.alert(
        '알림',
        '독후감을 작성해주세요.'
      );
      return;
    }

    try {
      setIsSaving(true);

      await createReview(
        readingRecordId,
        content,
        rating,
        oneLine
      );

      Alert.alert(
        '저장 완료',
        '독후감이 저장되었습니다.',
        [
          {
            text: '확인',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error(
        '독후감 저장 실패:',
        error
      );

      Alert.alert(
        '저장 실패',
        '백엔드 연결 상태를 확인해주세요.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
        >
          <Text style={styles.backButton}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          독후감 작성
        </Text>

        <View style={styles.headerSpace} />
      </View>

      <View style={styles.bookCard}>
        <View style={styles.bookCover}>
          <Text style={styles.bookEmoji}>
            📖
          </Text>
        </View>

        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle}>
            읽은 책
          </Text>

          <Text style={styles.bookDescription}>
            독서 기록과 연결될 예정입니다.
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        이 책은 어땠나요?
      </Text>

      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
          >
            <Text style={styles.star}>
              {star <= rating ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>
        한 줄 감상
      </Text>

      <TextInput
        style={styles.oneLineInput}
        value={oneLine}
        onChangeText={setOneLine}
        placeholder="책을 한 문장으로 표현해보세요."
        maxLength={100}
      />

      <Text style={styles.sectionTitle}>
        독후감
      </Text>

      <TextInput
        style={styles.contentInput}
        value={content}
        onChangeText={setContent}
        placeholder="책을 읽고 느낀 점을 자유롭게 작성해주세요."
        multiline
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[
          styles.saveButton,
          isSaving && styles.disabledButton,
        ]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Text style={styles.saveButtonText}>
          {isSaving
            ? '저장 중...'
            : '독후감 저장'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ReviewWriteScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8f3',
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
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

  bookCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },

  bookCover: {
    width: 65,
    height: 85,
    backgroundColor: '#eee9df',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  bookEmoji: {
    fontSize: 30,
  },

  bookInfo: {
    flex: 1,
    marginLeft: 15,
  },

  bookTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },

  bookDescription: {
    fontSize: 11,
    color: '#777777',
    marginTop: 5,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  starContainer: {
    flexDirection: 'row',
    marginBottom: 28,
  },

  star: {
    fontSize: 35,
    marginRight: 7,
    color: '#d5a94e',
  },

  oneLineInput: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 28,
    fontSize: 14,
  },

  contentInput: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 15,
    minHeight: 180,
    fontSize: 14,
    marginBottom: 25,
  },

  saveButton: {
    backgroundColor: '#4f7658',
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
  },

  disabledButton: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
