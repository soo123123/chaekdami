
import React, { useEffect, useState } from 'react';

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
  getReview,
} from '../../api/reviewApi';

const ReviewWriteScreen = () => {
  const params = useLocalSearchParams<{
    readingRecordId?: string;
    mode?: string;
  }>();

  // 임시 테스트 ID. 추후 FE1에서 전달
  const readingRecordId =
    Number(params.readingRecordId) || 1;

  const isEditMode = params.mode === 'edit';

  const [rating, setRating] = useState(0);
  const [oneLine, setOneLine] = useState('');
  const [content, setContent] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // 수정 모드일 때 기존 독후감 불러오기
  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    let active = true;

    const loadReview = async () => {
      try {
        setIsLoading(true);
        setLoadError(false);

        const data = await getReview(readingRecordId);

        if (!active) return;

        setRating(data.rating ?? 0);
        setOneLine(data.oneLine ?? '');
        setContent(data.content ?? '');
      } catch (error) {
        console.error(
          '독후감 불러오기 실패:',
          error
        );

        if (active) {
          setLoadError(true);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadReview();

    return () => {
      active = false;
    };
  }, [isEditMode, readingRecordId]);

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

    // 백엔드 수정 API 확정 전까지 수정 저장 차단
    if (isEditMode) {
      Alert.alert(
        '수정 기능 준비 중',
        '기존 독후감을 불러올 수 있지만, 수정 저장은 백엔드 API 연결 후 사용할 수 있습니다.'
      );
      return;
    }

    try {
      setIsSaving(true);

      await createReview(
        readingRecordId,
        content.trim(),
        rating,
        oneLine.trim()
      );

      // 웹에서도 이동하도록 저장 성공 후 직접 이동
      Alert.alert(
        '저장 완료',
        '독후감이 저장되었습니다.'
      );

      router.replace({
        pathname: '/review/review-detail',
        params: {
          readingRecordId: String(readingRecordId),
        },
      });
    } catch (error) {
      console.error(
        '독후감 저장 실패:',
        error
      );

      Alert.alert(
        '저장 실패',
        '독후감을 저장하지 못했습니다. 백엔드 연결 상태를 확인해주세요.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditMode && isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#4f7658"
        />
        <Text style={styles.loadingText}>
          기존 독후감을 불러오는 중입니다.
        </Text>
      </View>
    );
  }

  if (isEditMode && loadError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorTitle}>
          독후감을 불러오지 못했습니다.
        </Text>

        <Text style={styles.loadingText}>
          백엔드 서버 연결 상태를 확인해주세요.
        </Text>

        <TouchableOpacity
          style={styles.backToDetailButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backToDetailText}>
            돌아가기
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

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
          {isEditMode
            ? '독후감 수정'
            : '독후감 작성'}
        </Text>

        <View style={styles.headerSpace} />
      </View>

      {/* 안내 */}
      <View style={styles.guideCard}>
        <Text style={styles.guideEmoji}>
          ✍️
        </Text>

        <View style={styles.guideContent}>
          <Text style={styles.guideTitle}>
            {isEditMode
              ? '작성한 독후감을 수정해보세요'
              : '독서 후 생각을 기록해보세요'}
          </Text>

          <Text style={styles.guideDescription}>
            {isEditMode
              ? '기존에 작성한 내용을 확인하고 자유롭게 수정해보세요.'
              : '책을 읽으며 느낀 점과 기억하고 싶은 생각을 자유롭게 작성해보세요.'}
          </Text>
        </View>
      </View>

      {/* 별점 */}
      <Text style={styles.sectionTitle}>
        별점
      </Text>

      <View style={styles.ratingCard}>
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

      {/* 저장 버튼 */}
      <TouchableOpacity
        style={[
          styles.saveButton,
          isSaving && styles.disabledButton,
        ]}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.saveButtonText}>
            {isEditMode
              ? '독후감 수정하기'
              : '독후감 저장하기'}
          </Text>
        )}
      </TouchableOpacity>

      {isEditMode && (
        <Text style={styles.editNotice}>
          수정 저장 기능은 백엔드 API 연결 후
          사용할 수 있습니다.
        </Text>
      )}

      <Text style={styles.testNotice}>
        현재 테스트용 readingRecordId:{' '}
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
    color: '#333333',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222222',
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
    color: '#333333',
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
    color: '#222222',
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
    color: '#333333',
  },

  contentInput: {
    fontSize: 14,
    minHeight: 200,
    lineHeight: 22,
    color: '#333333',
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

  editNotice: {
    textAlign: 'center',
    color: '#987343',
    fontSize: 12,
    marginTop: 14,
  },

  testNotice: {
    textAlign: 'center',
    color: '#999999',
    fontSize: 10,
    marginTop: 12,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#faf8f3',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },

  loadingText: {
    fontSize: 13,
    color: '#777777',
    textAlign: 'center',
  },

  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },

  backToDetailButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#e9eee5',
  },

  backToDetailText: {
    color: '#4f7658',
    fontWeight: 'bold',
  },
});
