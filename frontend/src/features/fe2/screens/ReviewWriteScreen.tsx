import { toReviewDetail } from '@/constants/routes';

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
  Switch,
} from 'react-native';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/common/Icon';

import {
  BOOK_REPORT_MAX_LENGTH,
  getReadingReview,
  saveBookReport,
} from '../api/reviewApi';

/**
 * 독후감 작성·수정 화면.
 * - 독후감은 회차(readingRecordId)당 1개. 이미 쓴 독후감이 있으면 불러와서 수정한다.
 * - 완독한 회차(canWrite)에서만 저장할 수 있다.
 * - 별점·한줄평은 FE1 커뮤니티 화면에서 다루므로 여기에는 없다.
 */
const ReviewWriteScreen = () => {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    readingRecordId?: string;
  }>();

  const readingRecordId = Number(params.readingRecordId);
  const hasRecordId = Number.isInteger(readingRecordId) && readingRecordId > 0;

  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [round, setRound] = useState<number | null>(null);
  const [canWrite, setCanWrite] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(hasRecordId);
  const [loadError, setLoadError] = useState(false);

  // 회차의 독후감 상태 조회: 이미 썼으면 수정 모드로 내용을 채운다
  useEffect(() => {
    if (!hasRecordId) return;

    let active = true;

    const load = async () => {
      try {
        setIsLoading(true);
        setLoadError(false);

        const data = await getReadingReview(readingRecordId);

        if (!active) return;

        setRound(data.round);
        setCanWrite(data.canWrite);

        if (data.bookReport) {
          setIsEditMode(true);
          setContent(data.bookReport.content);
          setIsPublic(data.bookReport.isPublic);
        }
      } catch (error) {
        console.error('독후감 불러오기 실패:', error);
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

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('독후감 확인', '독후감 내용을 입력해주세요.');
      return;
    }

    try {
      setIsSaving(true);

      await saveBookReport(readingRecordId, {
        content: content.trim(),
        isPublic,
      });

      router.replace(toReviewDetail(readingRecordId));
    } catch (error) {
      console.error('독후감 저장 실패:', error);

      const status = (error as { response?: { status?: number } })?.response?.status;

      Alert.alert(
        '저장 실패',
        status === 409
          ? '완독한 회차에서만 독후감을 저장할 수 있어요.'
          : '독후감을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const containerPadding = { paddingTop: insets.top + 12 };

  if (!hasRecordId || (!isLoading && loadError)) {
    return (
      <View style={[styles.loadingContainer, containerPadding]}>
        <Text style={styles.errorTitle}>
          {hasRecordId ? '독후감을 불러오지 못했습니다.' : '독서 기록 정보가 없습니다.'}
        </Text>

        <Text style={styles.loadingText}>
          {hasRecordId ? '잠시 후 다시 시도해주세요.' : '독서 완료 화면에서 다시 들어와주세요.'}
        </Text>

        <TouchableOpacity style={styles.backToDetailButton} onPress={() => router.back()}>
          <Text style={styles.backToDetailText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, containerPadding]}>
        <ActivityIndicator size="large" color="#4f7658" />
        <Text style={styles.loadingText}>독후감을 불러오는 중입니다.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, containerPadding]}
      keyboardShouldPersistTaps="handled"
    >
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

        <Text style={styles.headerTitle}>
          {isEditMode ? '독후감 수정' : '독후감 작성'}
        </Text>

        <View style={styles.headerSpace} />
      </View>

      {/* 안내 */}
      <View style={styles.guideCard}>
        <Icon name="pencil" size={30} color="#4f7658" />

        <View style={styles.guideContent}>
          <Text style={styles.guideTitle}>
            {round !== null ? `${round}회독 독후감` : '독후감'}
            {isEditMode ? ' · 수정' : ''}
          </Text>

          <Text style={styles.guideDescription}>
            {canWrite
              ? '책을 읽으며 느낀 점과 기억하고 싶은 생각을 자유롭게 작성해보세요.'
              : '완독한 회차에서만 독후감을 저장할 수 있어요. 끝까지 읽은 뒤 다시 작성해주세요.'}
          </Text>
        </View>
      </View>

      {/* 독후감 */}
      <Text style={styles.sectionTitle}>독후감</Text>

      <View style={styles.inputCard}>
        <TextInput
          style={styles.contentInput}
          value={content}
          onChangeText={setContent}
          placeholder="책을 읽고 느낀 점을 자유롭게 작성해주세요."
          placeholderTextColor="#aaaaaa"
          multiline
          textAlignVertical="top"
          maxLength={BOOK_REPORT_MAX_LENGTH}
          editable={canWrite}
        />

        <Text style={styles.countText}>
          {content.length} / {BOOK_REPORT_MAX_LENGTH}
        </Text>
      </View>

      {/* 공개 여부 */}
      <View style={styles.publicCard}>
        <View style={styles.publicText}>
          <Text style={styles.publicTitle}>공개하기</Text>
          <Text style={styles.publicDescription}>
            공개하면 같은 책을 완독한 사람들이 커뮤니티에서 볼 수 있어요.
          </Text>
        </View>

        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          disabled={!canWrite}
          trackColor={{ true: '#4f7658', false: '#d8d4cc' }}
          thumbColor="#ffffff"
        />
      </View>

      {/* 저장 버튼 */}
      <TouchableOpacity
        style={[styles.saveButton, (isSaving || !canWrite) && styles.disabledButton]}
        onPress={handleSave}
        disabled={isSaving || !canWrite}
      >
        {isSaving ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.saveButtonText}>
            {isEditMode ? '독후감 수정하기' : '독후감 저장하기'}
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
    paddingBottom: 50,
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
    color: '#222222',
  },
  headerSpace: {
    width: 36,
  },
  guideCard: {
    backgroundColor: '#e9eee5',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
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
  inputCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 15,
    marginBottom: 16,
  },
  contentInput: {
    fontSize: 14,
    minHeight: 240,
    lineHeight: 22,
    color: '#333333',
  },
  countText: {
    textAlign: 'right',
    fontSize: 10,
    color: '#999999',
    marginTop: 8,
  },
  publicCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 25,
  },
  publicText: {
    flex: 1,
    gap: 4,
  },
  publicTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333333',
  },
  publicDescription: {
    fontSize: 11,
    color: '#777777',
    lineHeight: 16,
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
    opacity: 0.5,
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
