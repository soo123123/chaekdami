import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { router } from 'expo-router';
import { createReview } from '../../api/reviewApi';

const ReviewWriteScreen = () => {
  // TODO: 나중에 실제 독서 기록 ID를 화면 이동 시 전달받도록 변경
  const readingRecordId = 1;

  const [rating, setRating] = useState(0);
  const [oneLine, setOneLine] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (rating === 0) {
      Alert.alert(
        '별점 확인',
        '책에 대한 별점을 선택해주세요.'
      );
      return;
    }

    if (!oneLine.trim()) {
      Alert.alert(
        '한줄평 확인',
        '한줄평을 작성해주세요.'
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
        '독서 리뷰가 저장되었습니다.',
        [
          {
            text: '확인',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error(
        '리뷰 저장 실패:',
        error
      );

      Alert.alert(
        '저장 실패',
        '리뷰를 저장하지 못했습니다.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* 상단 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
        >
          <Text style={styles.backButton}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          독서 종료하기
        </Text>

        <View style={styles.headerSpace} />
      </View>

      {/* 완료 메시지 */}
      <View style={styles.heroCard}>
        <Text style={styles.heroEmoji}>
          🐱
        </Text>

        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>
            오늘도 수고했어요!
          </Text>

          <Text style={styles.heroDescription}>
            오늘의 독서를 기록하고 책에 대한
            생각을 남겨보세요.
          </Text>
        </View>
      </View>

      {/* 책 정보 */}
      <View style={styles.bookCard}>
        <View style={styles.bookCover}>
          <Text style={styles.bookEmoji}>
            📚
          </Text>
        </View>

        <View style={styles.bookInfo}>
          <Text style={styles.bookLabel}>
            오늘 읽은 책
          </Text>

          <Text style={styles.bookTitle}>
            선택한 도서
          </Text>

          <Text style={styles.bookAuthor}>
            도서 정보
          </Text>
        </View>
      </View>

      {/* 독서 결과 */}
      <Text style={styles.sectionTitle}>
        오늘의 독서 기록
      </Text>

      <View style={styles.recordCard}>
        <View style={styles.recordItem}>
          <Text style={styles.recordIcon}>
            ⏱️
          </Text>

          <Text style={styles.recordValue}>
            30분
          </Text>

          <Text style={styles.recordLabel}>
            독서 시간
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.recordItem}>
          <Text style={styles.recordIcon}>
            📖
          </Text>

          <Text style={styles.recordValue}>
            25쪽
          </Text>

          <Text style={styles.recordLabel}>
            읽은 페이지
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.recordItem}>
          <Text style={styles.recordIcon}>
            ✨
          </Text>

          <Text style={styles.recordValue}>
            +50
          </Text>

          <Text style={styles.recordLabel}>
            획득 XP
          </Text>
        </View>
      </View>

      {/* 별점 */}
      <Text style={styles.sectionTitle}>
        이 책은 어떠셨나요?
      </Text>

      <View style={styles.ratingCard}>
        <Text style={styles.ratingDescription}>
          별점을 선택해주세요.
        </Text>

        <View style={styles.starContainer}>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
            >
              <Text
                style={[
                  styles.star,
                  star <= rating
                    ? styles.selectedStar
                    : styles.unselectedStar,
                ]}
              >
                ★
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {rating > 0 && (
          <Text style={styles.ratingValue}>
            {rating}.0 / 5.0
          </Text>
        )}
      </View>

      {/* 한줄평 */}
      <Text style={styles.inputTitle}>
        한줄평
      </Text>

      <TextInput
        style={styles.oneLineInput}
        placeholder="이 책을 한 문장으로 표현해보세요."
        value={oneLine}
        onChangeText={setOneLine}
        maxLength={100}
      />

      <Text style={styles.characterCount}>
        {oneLine.length} / 100
      </Text>

      {/* 감상 기록 */}
      <Text style={styles.inputTitle}>
        감상 기록
      </Text>

      <TextInput
        style={styles.contentInput}
        placeholder={
          '책을 읽으며 느낀 점이나 기억하고 싶은 내용을 자유롭게 작성해보세요.'
        }
        value={content}
        onChangeText={setContent}
        multiline
        textAlignVertical="top"
        maxLength={1000}
      />

      <Text style={styles.characterCount}>
        {content.length} / 1000
      </Text>

      {/* 저장 버튼 */}
      <TouchableOpacity
        style={[
          styles.saveButton,
          isSaving && styles.disabledButton,
        ]}
        disabled={isSaving}
        onPress={handleSave}
      >
        {isSaving ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.saveButtonText}>
            독서 기록 완료하기
          </Text>
        )}
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
    paddingBottom: 40,
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

  heroCard: {
    backgroundColor: '#f2eadc',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  heroEmoji: {
    fontSize: 42,
  },

  heroContent: {
    flex: 1,
    marginLeft: 14,
  },

  heroTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },

  heroDescription: {
    fontSize: 12,
    marginTop: 5,
    lineHeight: 18,
  },

  bookCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },

  bookCover: {
    width: 65,
    height: 85,
    borderRadius: 8,
    backgroundColor: '#eee9df',
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

  bookLabel: {
    fontSize: 11,
    marginBottom: 5,
  },

  bookTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },

  bookAuthor: {
    fontSize: 12,
    marginTop: 5,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  recordCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },

  recordItem: {
    flex: 1,
    alignItems: 'center',
  },

  recordIcon: {
    fontSize: 20,
    marginBottom: 5,
  },

  recordValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  recordLabel: {
    fontSize: 10,
    marginTop: 4,
  },

  divider: {
    width: 1,
    height: 45,
    backgroundColor: '#e4e4e4',
  },

  ratingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 25,
  },

  ratingDescription: {
    fontSize: 13,
    marginBottom: 12,
  },

  starContainer: {
    flexDirection: 'row',
  },

  star: {
    fontSize: 38,
    marginHorizontal: 4,
  },

  selectedStar: {
    color: '#e7a936',
  },

  unselectedStar: {
    color: '#dddddd',
  },

  ratingValue: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: 'bold',
  },

  inputTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  oneLineInput: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 15,
    fontSize: 14,
  },

  contentInput: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 15,
    height: 150,
    fontSize: 14,
  },

  characterCount: {
    textAlign: 'right',
    fontSize: 11,
    marginTop: 5,
    marginBottom: 20,
  },

  saveButton: {
    backgroundColor: '#4f7658',
    borderRadius: 24,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 5,
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
