import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import { getReview } from '../../api/reviewApi';

interface Review {
  rating?: number;
  oneLine?: string;
  content?: string;
}

const ReviewDetailScreen = () => {
  const params =
    useLocalSearchParams<{ readingRecordId?: string }>();

  const readingRecordId =
    Number(params.readingRecordId) || 1;

  const [review, setReview] =
    useState<Review | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    const loadReview = async () => {
      try {
        const data =
          await getReview(readingRecordId);

        setReview(data);
      } catch (error) {
        console.error(
          '독후감 조회 실패:',
          error
        );

        // 백엔드 연결 전 테스트용
        setReview({
          rating: 4,
          oneLine:
            '다시 한번 생각하게 만드는 책',
          content:
            '이곳에는 작성한 독후감 내용이 표시됩니다.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadReview();
  }, [readingRecordId]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          독후감을 불러오는 중...
        </Text>
      </View>
    );
  }

  const rating = review?.rating ?? 0;

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
          독후감
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
            독서 기록 #{readingRecordId}
          </Text>
        </View>
      </View>

      <View style={styles.reviewCard}>
        <Text style={styles.label}>
          별점
        </Text>

        <Text style={styles.stars}>
          {[1, 2, 3, 4, 5]
            .map(star =>
              star <= rating ? '★' : '☆'
            )
            .join(' ')}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.label}>
          한 줄 감상
        </Text>

        <Text style={styles.oneLine}>
          {review?.oneLine ||
            '작성된 한 줄 감상이 없습니다.'}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.label}>
          독후감
        </Text>

        <Text style={styles.reviewContent}>
          {review?.content ||
            '작성된 독후감이 없습니다.'}
        </Text>
      </View>
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
    paddingBottom: 50,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
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
    marginBottom: 20,
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

  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
  },

  label: {
    fontSize: 13,
    color: '#777777',
    marginBottom: 8,
  },

  stars: {
    fontSize: 25,
    color: '#d5a94e',
  },

  oneLine: {
    fontSize: 17,
    fontWeight: 'bold',
    lineHeight: 25,
  },

  reviewContent: {
    fontSize: 14,
    lineHeight: 23,
  },

  divider: {
    height: 1,
    backgroundColor: '#eeeeee',
    marginVertical: 20,
  },
});
