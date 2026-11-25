import { toReviewWrite, ROUTES } from '@/constants/routes';

import React, { useCallback, useRef, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { goBackOr } from '@/utils/navigation';
import { HIT_SLOP } from '@/constants/layout';

import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/common/Icon';
import { showToast } from '@/components/Toast';

import {
  deleteBookReport,
  getReadingReview,
  type ReadingReviewResponse,
} from '../api/reviewApi';

/** "2026-11-09T01:58:43" → "2026.11.09" */
function formatDate(value: string) {
  return value.slice(0, 10).replace(/-/g, '.');
}

function confirmDelete(): Promise<boolean> {
  const title = '독후감 삭제';
  const message = '이 독후감을 삭제할까요? 삭제하면 되돌릴 수 없어요.';

  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n${message}`));
  }

  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: '취소', style: 'cancel', onPress: () => resolve(false) },
        { text: '삭제', style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: false }
    );
  });
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

  const [isDeleting, setIsDeleting] = useState(false);
  // 확인 창이 떠 있거나 요청 중이면 다시 누를 수 없다
  const deletingRef = useRef(false);
  // 마지막 조회만 화면에 반영한다
  const loadIdRef = useRef(0);
  const focusedRef = useRef(false);

  const load = useCallback(async () => {
    const loadId = ++loadIdRef.current;

    try {
      const response = await getReadingReview(readingRecordId);
      if (loadId !== loadIdRef.current) return;

      setData(response);
      setLoadError(false);
    } catch (error) {
      if (loadId !== loadIdRef.current) return;

      console.error('독후감 상세 조회 실패:', error);
      setLoadError(true);
    }

    setIsLoading(false);
  }, [readingRecordId]);

  // 수정·삭제하고 돌아왔을 때 이전 내용이 남지 않게 들어올 때마다 조회한다
  useFocusEffect(
    useCallback(() => {
      if (!hasRecordId) return undefined;

      focusedRef.current = true;
      void load();

      return () => {
        focusedRef.current = false;
        loadIdRef.current += 1;
      };
    }, [hasRecordId, load])
  );

  const handleDelete = async (bookReportId: number) => {
    if (deletingRef.current) return;

    deletingRef.current = true;

    try {
      if (!(await confirmDelete())) return;

      setIsDeleting(true);
      await deleteBookReport(bookReportId);

      showToast('독후감을 삭제했어요.');
      // 요청 중에 이미 화면을 나갔으면 더 뒤로 가지 않는다
      if (focusedRef.current) goBackOr(ROUTES.fe1.library);
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;

      if (status === 404) {
        // 다른 곳에서 이미 지워진 독후감
        showToast('이미 삭제된 독후감이에요.', 'error');
        if (focusedRef.current) await load();
      } else {
        console.error('독후감 삭제 실패:', error);
        showToast('독후감을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.', 'error');
      }
    } finally {
      deletingRef.current = false;
      setIsDeleting(false);
    }
  };

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
        <TouchableOpacity style={styles.writeButton} onPress={() => goBackOr(ROUTES.fe1.library)}>
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
          onPress={() => goBackOr(ROUTES.fe1.library)}
          style={styles.backTouch}
          hitSlop={HIT_SLOP}
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
      <TouchableOpacity
        style={[styles.editButton, isDeleting && styles.disabledButton]}
        onPress={goWrite}
        disabled={isDeleting}
      >
        <Text style={styles.editButtonText}>독후감 수정하기</Text>
      </TouchableOpacity>

      {/* 삭제 */}
      <TouchableOpacity
        style={[styles.deleteButton, isDeleting && styles.disabledButton]}
        onPress={() => handleDelete(report.bookReportId)}
        disabled={isDeleting}
        accessibilityRole="button"
      >
        <Text style={styles.deleteButtonText}>
          {isDeleting ? '삭제 중...' : '독후감 삭제하기'}
        </Text>
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
    marginBottom: 10,
  },
  deleteButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteButtonText: {
    color: '#a15a4a',
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
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
