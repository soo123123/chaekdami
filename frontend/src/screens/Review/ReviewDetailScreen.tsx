import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { router } from 'expo-router';
import { getReview } from '../../api/reviewApi';

interface Review {
  id?: number;

  content: string;
  rating: number;
  oneLine: string;

  bookTitle?: string;
  author?: string;

  readingTime?: number;
  readPages?: number;

  createdAt?: string;
}

const ReviewDetailScreen = () => {
  // TODO:
  // FE1 화면과 연결할 때 실제 readingRecordId를 전달받도록 변경
  const readingRecordId = 1;

  const [review, setReview] =
    useState<Review | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const loadReview = async () => {
    try {
      setIsLoading(true);

      const data = await getReview(
        readingRecordId
      );

      setReview(data);
    } catch (error) {
      console.error(
        '리뷰 조회 실패:',
        error
      );

      // 백엔드 연결 전 화면 확인용 데이터
      setReview({
        id: 1,
        bookTitle: '아주 작은 습관의 힘',
        author: '제임스 클리어',

        rating: 4,

        oneLine:
          '작은 습관이 큰 변화를 만든다는 것을 느꼈다.',

        content:
          '매일 조금씩 반복하는 행동이 결국 큰 결과를 만든다는 점이 인상 깊었다. 독서를 마친 뒤 나의 생활 습관도 다시 돌아보게 되었다.',

        readingTime: 30,
        readPages: 25,

        createdAt: '2026.09.30',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReview();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          리뷰를 불러오는 중...
        </Text>
      </View>
    );
  }

  if (!review) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>
          리뷰가 없습니다.
        </Text>

        <TouchableOpacity
          style={styles.backHomeButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backHomeText}>
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
          독서 기록
        </Text>

        <View style={styles.headerSpace} />
      </View>

      {/* 책 정보 */}
      <View style={styles.bookCard}>
        <View style={styles.bookCover}>
          <Text style={styles.bookEmoji}>
            📚
          </Text>
        </View>

        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle}>
            {review.bookTitle ??
              '도서 제목'}
          </Text>

          <Text style={styles.author}>
            {review.author ??
              '저자 정보'}
          </Text>

          {review.createdAt && (
            <Text style={styles.date}>
              {review.createdAt}
            </Text>
          )}
        </View>
      </View>

      {/* 독서 기록 */}
      <Text style={styles.sectionTitle}>
        독서 기록
      </Text>

      <View style={styles.recordCard}>
        <View style={styles.recordItem}>
          <Text style={styles.recordIcon}>
            ⏱️
          </Text>

          <Text style={styles.recordValue}>
            {review.readingTime ?? 0}분
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
            {review.readPages ?? 0}쪽
          </Text>

          <Text style={styles.recordLabel}>
            읽은 페이지
          </Text>
        </View>
      </View>

      {/* 별점 */}
      <Text style={styles.sectionTitle}>
        나의 별점
      </Text>

      <View style={styles.ratingCard}>
        <View style={styles.starContainer}>
          {[1, 2, 3, 4, 5].map(star => (
            <Text
              key={star}
              style={[
                styles.star,
                star <= review.rating
                  ? styles.selectedStar
                  : styles.unselectedStar,
              ]}
            >
              ★
            </Text>
          ))}
        </View>

        <Text style={styles.ratingText}>
          {review.rating}.0 / 5.0
        </Text>
      </View>

      {/* 한줄평 */}
      <Text style={styles.sectionTitle}>
        한줄평
      </Text>

      <View style={styles.reviewCard}>
        <Text style={styles.oneLine}>
          “{review.oneLine}”
        </Text>
      </View>

      {/* 감상 기록 */}
      <Text style={styles.sectionTitle}>
        감상 기록
      </Text>

      <View style={styles.reviewCard}>
        <Text style={styles.contentText}>
          {review.content ||
            '작성한 감상 기록이 없습니다.'}
        </Text>
      </View>

      {/* 수정 버튼 */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => {
          Alert.alert(
            '리뷰 수정',
            '리뷰 수정 기능은 이후 단계에서 연결할 수 있습니다.'
          );
        }}
      >
        <Text style={styles.editButtonText}>
          리뷰 수정하기
        </Text>
      </TouchableOpacity>

      {/* 완료 */}
      <TouchableOpacity
        style={styles.completeButton}
        onPress={() => router.back()}
      >
        <Text style={styles.completeButtonText}>
          확인
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ReviewDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8f3',
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  loadingText: {
    marginTop: 10,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  backHomeButton: {
    marginTop: 20,
    backgroundColor: '#4f7658',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
  },

  backHomeText: {
    color: '#ffffff',
    fontWeight: 'bold',
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

  bookCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },

  bookCover: {
    width: 75,
    height: 100,
    borderRadius: 10,
    backgroundColor: '#eee9df',
    justifyContent: 'center',
    alignItems: 'center',
  },

  bookEmoji: {
    fontSize: 34,
  },

  bookInfo: {
    flex: 1,
    marginLeft: 16,
  },

  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  author: {
    fontSize: 13,
    marginTop: 6,
  },

  date: {
    fontSize: 11,
    marginTop: 10,
    color: '#777777',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  recordCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 20,
    flexDirection: 'row',
    marginBottom: 25,
  },

  recordItem: {
    flex: 1,
    alignItems: 'center',
  },

  recordIcon: {
    fontSize: 22,
  },

  recordValue: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 5,
  },

  recordLabel: {
    fontSize: 11,
    marginTop: 4,
  },

  divider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },

  ratingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    marginBottom: 25,
  },

  starContainer: {
    flexDirection: 'row',
  },

  star: {
    fontSize: 35,
    marginHorizontal: 3,
  },

  selectedStar: {
    color: '#e7a936',
  },

  unselectedStar: {
    color: '#dddddd',
  },

  ratingText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: 'bold',
  },

  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 25,
  },

  oneLine: {
    fontSize: 15,
    fontWeight: 'bold',
    lineHeight: 23,
  },

  contentText: {
    fontSize: 14,
    lineHeight: 23,
  },

  editButton: {
    borderWidth: 1,
    borderColor: '#4f7658',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },

  editButtonText: {
    color: '#4f7658',
    fontSize: 15,
    fontWeight: 'bold',
  },

  completeButton: {
    backgroundColor: '#4f7658',
    borderRadius: 24,
    paddingVertical: 15,
    alignItems: 'center',
  },

  completeButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
