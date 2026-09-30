import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  createReview,
} from '../../api/reviewApi';

const ReviewWriteScreen = () => {
  const params =
    useLocalSearchParams<{
      readingRecordId?: string;
    }>();

  // FE1에서 readingRecordId를 전달받게 됨
  // 현재는 테스트를 위해 1 사용
  const readingRecordId =
    Number(params.readingRecordId) || 1;

  const [rating, setRating] =
    useState(0);

  const [oneLine, setOneLine] =
    useState('');

  const [content, setContent] =
    useState('');

  const [isSaving, setIsSaving] =
    useState(false);

  const handleSave = async () => {
    if (rating === 0) {
      Alert.alert(
        '별점 확인',
        '별점을 선택해주세요.'
      );

      return;
    }

    if (!oneLine.trim()) {
      Alert.alert(
        '한줄평 확인',
        '한줄평을 입력해주세요.'
      );

      return;
    }

    if (!content.trim()) {
      Alert.alert(
        '독후감 확인',
        '독후감 내용을 입력해주세요.'
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

            onPress: () => {
              router.replace({
                pathname: '/review-detail',

                params: {
                  readingRecordId:
                    String(
                      readingRecordId
                    ),
                },
              });
            },
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
        '독후감을 저장하지 못했습니다.\n백엔드 연결 상태를 확인해주세요.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      keyboardShouldPersistTaps="handled"
    >
      {/* 상단 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            router.back()
          }
        >
          <Text style={styles.backButton}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          독후감 작성
        </Text>

        <View
          style={styles.headerSpace}
        />
      </View>

      {/* 안내 */}
      <View style={styles.guideCard}>
        <Text style={styles.guideEmoji}>
          ✍️
        </Text>

        <View style={styles.guideContent}>
          <Text style={styles.guideTitle}>
            독서 후 생각을 기록해보세요
          </Text>

          <Text
            style={styles.guideDescription}
          >
            책을 읽으며 느낀 점과
            기억하고 싶은 생각을
            자유롭게 작성해보세요.
          </Text>
        </View>
      </View>

      {/* 별점 */}
      <Text style={styles.sectionTitle}>
        별점
      </Text>

      <View style={styles.ratingCard}>
        <View style={styles.starContainer}>
          {[1, 2, 3, 4, 5].map(
            star => (
              <TouchableOpacity
                key={star}
                onPress={() =>
                  setRating(star)
                }
              >
                <Text style={styles.star}>
                  {star <= rating
                    ? '★'
                    : '☆'}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <Text style={styles.ratingText}>
          {rating === 0
            ? '별점을 선택해주세요.'
            : `${rating}점`}
        </Text>
      </View>

      {/* 한줄평 */}
      <Text style={styles.sectionTitle}>
        한줄평
      </Text>

      <View style={styles.inputCard}>
        <TextInput
          style={styles.oneLineInput}
          value={oneLine}
          onChangeText={setOneLine}
          placeholder="이 책을 한 문장으로 표현해보세요."
          placeholderTextColor="#aaaaaa"
          maxLength={100}
        />

        <Text style={styles.countText}>
          {oneLine.length} / 100
        </Text>
      </View>

      {/* 독후감 */}
      <Text style={styles.sectionTitle}>
        독후감
      </Text>

      <View style={styles.inputCard}>
        <TextInput
          style={styles.contentInput}
          value={content}
          onChangeText={setContent}
          placeholder="책을 읽고 느낀 점을 자유롭게 작성해주세요."
          placeholderTextColor="#aaaaaa"
          multiline
          textAlignVertical="top"
          maxLength={2000}
        />

        <Text style={styles.countText}>
          {content.length} / 2000
        </Text>
      </View>

      {/* 저장 */}
      <TouchableOpacity
        style={[
          styles.saveButton,
          isSaving &&
            styles.disabledButton,
        ]}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator
            color="#ffffff"
          />
        ) : (
          <Text
            style={styles.saveButtonText}
          >
            독후감 저장하기
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.testNotice}>
        현재 테스트용 readingRecordId:
        {' '}
        {readingRecordId}
      </Text>
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

  guideCard: {
    backgroundColor: '#e9eee5',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },

  guideEmoji: {
    fontSize: 32,
  },

  guideContent: {
    flex: 1,
    marginLeft: 14,
  },

  guideTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  guideDescription: {
    fontSize: 11,
    color: '#777777',
    lineHeight: 17,
    marginTop: 5,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 5,
  },

  ratingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 25,
  },

  starContainer: {
    flexDirection: 'row',
  },

  star: {
    fontSize: 38,
    color: '#d7a940',
    marginHorizontal: 4,
  },

  ratingText: {
    fontSize: 12,
    color: '#777777',
    marginTop: 8,
  },

  inputCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 15,
    marginBottom: 25,
  },

  oneLineInput: {
    fontSize: 14,
    minHeight: 45,
  },

  contentInput: {
    fontSize: 14,
    minHeight: 200,
    lineHeight: 22,
  },

  countText: {
    textAlign: 'right',
    fontSize: 10,
    color: '#999999',
    marginTop: 8,
  },

  saveButton: {
    backgroundColor: '#4f7658',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },

  saveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },

  disabledButton: {
    opacity: 0.6,
  },

  testNotice: {
    textAlign: 'center',
    color: '#999999',
    fontSize: 10,
    marginTop: 12,
  },
});
