import { toReviewWrite } from '@/constants/routes';

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

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/common/Icon';

import {
  getReadingReview,
  type ReadingReviewResponse,
} from '../api/reviewApi';

/** "2026-11-09T01:58:43" → "2026.11.09" */
function formatDate(value: string) {
  return value.slice(0, 10).replace(/-/g, '.');
}

/**
 * 독후감 상세 화면 (회차당 1개).
 * 별점·한줄평은 FE1 커뮤니티 화면에서 다루므로 여기에는 독후감 본문과 공개 여부만 보여준다.
 */
const ReviewDetailScreen = () => {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    readingRecordId?: string;
  }>();

  const readingRecordId = Number(params.readingRecordId);
  const hasRecordId = Number.isInteger(readingRecordId) && readingRecordId > 0;

  const [data, setData] = useState<ReadingReviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(hasRecordId);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!hasRecordId) return;

    let active = true;

    const load = async () => {
      try {
        setIsLoading(true);
        setLoadError(false);
        const response = await getReadingReview(readingRecordId);
        if (active) setData(response);
      } catch (error) {
        console.error('독후감 상세 조회 실패:', error);
        if (active) setLoadError(true);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [hasRecordId, readingRecordId]);

  const goWrite = () => router.push(toReviewWrite(readingRecordId));
  const containerPadding = { paddingTop: insets.top + 12 };

  if (isLoading) {
    return (
      <View style={[styles.center, containerPadding]}>
        <ActivityIndicator size="large" color="#4f7658" />
        <Text style={styles.loadingText}>독후감을 불러오는 중...</Text>
      </View>
    );
  }

  if (!hasRecordId || loadError || !data) {
    return (
      <View style={[styles.center, containerPadding]}>
        <Text style={styles.emptyTitle}>
          {hasRecordId ? '독후감을 불러오지 못했습니다.' : '독서 기록 정보가 없습니다.'}
        </Text>
        <TouchableOpacity style={styles.writeButton} onPress={() => router.back()}>
          <Text style={styles.writeButtonText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const report = data.bookReport;

  // 아직 독후감을 쓰지 않은 회차
  if (!report) {
    return (
      <View style={[styles.center, containerPadding]}>
        <Icon name="bookOpenOutline" size={44} color="#4f7658" />
        <Text style={styles.emptyTitle}>작성된 독후감이 없습니다.</Text>
        {data.canWrite ? (
          <TouchableOpacity style={styles.writeButton} onPress={goWrite}>
            <Text style={styles.writeButtonText}>독후감 작성하기</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.loadingText}>완독하면 독후감을 쓸 수 있어요.</Text>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, containerPadding]}>
      {/* 상단 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backTouch}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
        >
          <Icon name="back" size={28} color="#333333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>독후감</Text>

        <View style={styles.headerSpace} />
      </View>

      {/* 독후감 카드 */}
      <View style={styles.reviewCard}>
        <View style={styles.cardTop}>
          <Text style={styles.label}>{data.round}회독 독후감</Text>
          <Text style={[styles.badge, report.isPublic ? styles.badgePublic : styles.badgePrivate]}>
            {report.isPublic ? '공개' : '비공개'}
          </Text>
        </View>

        <Text style={styles.reviewContent}>{report.content}</Text>

        <Text style={styles.date}>
          작성일 {formatDate(report.createdAt)}
          {report.revision > 1 ? ` · 수정 ${formatDate(report.updatedAt)}` : ''}
        </Text>
      </View>

      {/* 수정 */}
      <TouchableOpacity style={styles.editButton} onPress={goWrite}>
        <Text style={styles.editButtonText}>독후감 수정하기</Text>
      </TouchableOpacity>

      {/* 안내 */}
      <View style={styles.guideCard}>
        <Icon name="leaf" size={28} color="#4f7658" />

        <View style={styles.guideContent}>
          <Text style={styles.guideTitle}>독서의 흔적을 남겨보세요</Text>

          <Text style={styles.guideDescription}>
            작성한 독후감은 책을 읽으며 느꼈던 생각을 다시 떠올리는 데 도움이 됩니다.
          </Text>
        </View>
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
  backTouch: {
    width: 36,
    height: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSpace: {
    width: 36,
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  badge: {
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  badgePublic: {
    color: '#4f7658',
    backgroundColor: '#e9eee5',
  },
  badgePrivate: {
    color: '#777777',
    backgroundColor: '#f0eee9',
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
});
