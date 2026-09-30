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

import {
  getReview,
} from '../../api/reviewApi';

interface Review {
  id?: number;
  readingRecordId?: number;
  content: string;
  rating: number;
  oneLine: string;
  createdAt?: string;
}

const ReviewDetailScreen = () => {
  const params =
    useLocalSearchParams<{
      readingRecordId?: string;
    }>();

  // FE1에서 실제 readingRecordId를 전달받게 됨
  // 현재는 테스트를 위해 1 사용
  const readingRecordId =
    Number(params.readingRecordId) || 1;

  const [review, setReview] =
    useState<Review | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  // 리뷰 상세 정보 불러오기
  useEffect(() => {
    const loadReview = async () => {
      try {
        const data =
          await getReview(
            readingRecordId
          );

        setReview(data);
      } catch (error) {
        console.error(
          '리뷰 상세 조회 실패:',
          error
        );

        // 백엔드 연결 전 테스트용 데이터
        setReview({
          id: 1,
          readingRecordId:
            readingRecordId,
          rating: 4,
          oneLine:
            '다시 한번 생각하게 만드는 책',
          content:
            '책을 읽으면서 여러 가지 생각을 할 수 있었습니다. 기억에 남는 부분도 많았고, 나중에 다시 한번 읽어보고 싶은 책입니다.',
          createdAt:
            '2026.09.30',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadReview();
  }, [readingRecordId]);

  // 로딩 화면
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
        />

        <Text style={styles.loadingText}>
          독후감을 불러오는 중...
        </Text>
      </View>
    );
  }

  // 리뷰 데이터가 없는 경우
  if (!review) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyEmoji}>
          📖
        </Text>

        <Text style={styles.emptyTitle}>
          작성된 독후감이 없습니다.
        </Text>

        <TouchableOpacity
          style={styles.writeButton}
          onPress={() =>
            router.push({
              pathname:
                '/review-write',

              params: {
                readingRecordId:
                  String(
                    readingRecordId
                  ),
              },
            })
          }
        >
          <Text
            style={styles.writeButtonText}
          >
            독후감 작성하기
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
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
          독후감
        </Text>

        <View
          style={styles.headerSpace}
        />
      </View>

      {/* 독후감 카드 */}
      <View style={styles.reviewCard}>
        {/* 별점 */}
        <Text style={styles.label}>
          나의 별점
        </Text>

        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map(
            star => (
              <Text
                key={star}
                style={styles.star}
              >
                {star <= review.rating
                  ? '★'
                  : '☆'}
              </Text>
            )
          )}

          <Text
            style={styles.ratingNumber}
          >
            {review.rating} / 5
          </Text>
        </View>

        <View style={styles.divider} />

        {/* 한줄평 */}
        <Text style={styles.label}>
          한줄평
        </Text>

        <View
          style={styles.oneLineCard}
        >
          <Text
            style={styles.oneLineText}
          >
            “{review.oneLine}”
          </Text>
        </View>

        <View style={styles.divider} />

        {/* 독후감 */}
        <Text style={styles.label}>
          독후감
        </Text>

        <Text
          style={styles.reviewContent}
        >
          {review.content}
        </Text>

        {/* 작성 날짜 */}
        {review.createdAt && (
          <Text style={styles.date}>
            작성일 {review.createdAt}
          </Text>
        )}
      </View>

      {/* 다시 작성/수정 */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={() =>
          router.push({
            pathname:
              '/review-write',

            params: {
              readingRecordId:
                String(
                  readingRecordId
                ),
            },
          })
        }
      >
        <Text
          style={styles.editButtonText}
        >
          독후감 수정하기
        </Text>
      </TouchableOpacity>

      {/* 안내 */}
      <View style={styles.guideCard}>
        <Text style={styles.guideEmoji}>
          🌱
        </Text>

        <View style={styles.guideContent}>
          <Text
            style={styles.guideTitle}
          >
            독서의 흔적을 남겨보세요
          </Text>

          <Text
            style={
              styles.guideDescription
            }
          >
            작성한 독후감은 책을 읽으며
            느꼈던 생각을 다시 떠올리는 데
            도움이 됩니다.
          </Text>
        </View>
      </View>

      {/* 테스트 안내 */}
      <Text style={styles.testNotice}>
        현재 readingRecordId:
        {' '}
        {readingRecordId}
      </Text>
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
    backgroundColor: '#faf8f3',
    padding: 20,
  },

  loadingText: {
    marginTop: 10,
    color: '#777777',
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

  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
  },

  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  star: {
    fontSize: 27,
    color: '#d7a940',
    marginRight: 3,
  },

  ratingNumber: {
    fontSize: 12,
    color: '#777777',
    marginLeft: 8,
  },

  divider: {
    height: 1,
    backgroundColor: '#eeeeee',
    marginVertical: 20,
  },

  oneLineCard: {
    backgroundColor: '#f2eee6',
    borderRadius: 15,
    padding: 16,
  },

  oneLineText: {
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 21,
  },

  reviewContent: {
    fontSize: 14,
    lineHeight: 24,
    color: '#444444',
  },

  date: {
    textAlign: 'right',
    fontSize: 10,
    color: '#999999',
    marginTop: 20,
  },

  editButton: {
    borderWidth: 1,
    borderColor: '#4f7658',
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },

  editButtonText: {
    color: '#4f7658',
    fontWeight: 'bold',
  },

  guideCard: {
    backgroundColor: '#e9eee5',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  guideEmoji: {
    fontSize: 30,
  },

  guideContent: {
    flex: 1,
    marginLeft: 14,
  },

  guideTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  guideDescription: {
    fontSize: 11,
    lineHeight: 17,
    color: '#777777',
    marginTop: 5,
  },

  emptyEmoji: {
    fontSize: 45,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 15,
  },

  writeButton: {
    backgroundColor: '#4f7658',
    borderRadius: 18,
    paddingHorizontal: 25,
    paddingVertical: 13,
    marginTop: 20,
  },

  writeButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },

  testNotice: {
    textAlign: 'center',
    color: '#999999',
    fontSize: 10,
    marginTop: 15,
  },
});
