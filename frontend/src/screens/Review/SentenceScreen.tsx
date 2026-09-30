import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';

import {
  getSentences,
  createSentence,
  deleteSentence,
} from '../../api/reviewApi';

interface Sentence {
  id: number;
  content: string;
  pageNumber: number;
}

const SentenceScreen = () => {
  const params = useLocalSearchParams<{
    readingRecordId?: string;
  }>();

  // FE1과 연결되기 전에는 1번 기록을 테스트용으로 사용
  const readingRecordId =
    Number(params.readingRecordId) || 1;

  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 문장 추가 Modal
  const [modalVisible, setModalVisible] = useState(false);

  const [content, setContent] = useState('');
  const [pageNumber, setPageNumber] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  // 문장 목록 불러오기
  const loadSentences = async () => {
    try {
      setIsLoading(true);

      const data = await getSentences(readingRecordId);

      setSentences(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        '문장 조회 실패:',
        error
      );

      // 백엔드 연결 전 화면 테스트용
      setSentences([
        {
          id: 1,
          content:
            '작은 변화가 쌓이면 결국 놀라운 결과를 만들어낸다.',
          pageNumber: 42,
        },
        {
          id: 2,
          content:
            '우리는 목표의 수준까지 올라가는 것이 아니라 시스템의 수준까지 내려간다.',
          pageNumber: 58,
        },
        {
          id: 3,
          content:
            '좋은 습관을 만드는 가장 좋은 방법은 쉽게 시작하는 것이다.',
          pageNumber: 91,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSentences();
  }, [readingRecordId]);

  // 문장 저장
  const handleCreateSentence = async () => {
    if (!content.trim()) {
      Alert.alert(
        '문장 확인',
        '기억하고 싶은 문장을 입력해주세요.'
      );

      return;
    }

    const page = Number(pageNumber);

    if (
      !Number.isInteger(page) ||
      page <= 0
    ) {
      Alert.alert(
        '페이지 확인',
        '올바른 페이지 번호를 입력해주세요.'
      );

      return;
    }

    try {
      setIsSaving(true);

      const newSentence =
        await createSentence(
          readingRecordId,
          content.trim(),
          page
        );

      // 백엔드에서 생성된 문장을 반환하는 경우
      if (
        newSentence &&
        newSentence.id !== undefined
      ) {
        setSentences(current => [
          newSentence,
          ...current,
        ]);
      } else {
        // 반환 구조가 확정되지 않았을 때 다시 조회
        await loadSentences();
      }

      setContent('');
      setPageNumber('');
      setModalVisible(false);

      Alert.alert(
        '저장 완료',
        '문장을 저장했습니다.'
      );
    } catch (error) {
      console.error(
        '문장 저장 실패:',
        error
      );

      Alert.alert(
        '저장 실패',
        '문장을 저장하지 못했습니다.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // 문장 삭제 확인
  const handleDelete = (
    sentenceId: number
  ) => {
    Alert.alert(
      '문장 삭제',
      '이 문장을 삭제하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',

          onPress: async () => {
            try {
              await deleteSentence(
                sentenceId
              );

              setSentences(current =>
                current.filter(
                  sentence =>
                    sentence.id !==
                    sentenceId
                )
              );
            } catch (error) {
              console.error(
                '문장 삭제 실패:',
                error
              );

              Alert.alert(
                '삭제 실패',
                '문장을 삭제하지 못했습니다.'
              );
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          문장을 불러오는 중...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          문장 기록
        </Text>

        <TouchableOpacity
          style={styles.addHeaderButton}
          onPress={() =>
            setModalVisible(true)
          }
        >
          <Text style={styles.addHeaderText}>
            ＋
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {/* 안내 */}
        <View style={styles.heroCard}>
          <Text style={styles.heroEmoji}>
            ✍️
          </Text>

          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              마음에 남은 문장을 기록해보세요
            </Text>

            <Text
              style={styles.heroDescription}
            >
              책을 읽으며 기억하고 싶은
              문장을 모아볼 수 있어요.
            </Text>
          </View>
        </View>

        {/* 개수 */}
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>
            저장한 문장
          </Text>

          <Text style={styles.countText}>
            {sentences.length}개
          </Text>
        </View>

        {/* 문장 목록 */}
        {sentences.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>
              📖
            </Text>

            <Text style={styles.emptyTitle}>
              저장한 문장이 없어요
            </Text>

            <Text
              style={styles.emptyDescription}
            >
              마음에 드는 문장을
              처음으로 기록해보세요.
            </Text>
          </View>
        ) : (
          sentences.map(sentence => (
            <View
              key={sentence.id}
              style={styles.sentenceCard}
            >
              <Text style={styles.quote}>
                “
              </Text>

              <Text
                style={styles.sentenceContent}
              >
                {sentence.content}
              </Text>

              <View
                style={styles.sentenceFooter}
              >
                <Text style={styles.pageText}>
                  p. {sentence.pageNumber}
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    handleDelete(
                      sentence.id
                    )
                  }
                >
                  <Text
                    style={styles.deleteText}
                  >
                    삭제
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* 하단 추가 버튼 */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            setModalVisible(true)
          }
        >
          <Text style={styles.addButtonText}>
            + 문장 추가하기
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 문장 추가 Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setModalVisible(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                문장 기록
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setModalVisible(false)
                }
              >
                <Text style={styles.closeText}>
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>
              기억하고 싶은 문장
            </Text>

            <TextInput
              style={styles.sentenceInput}
              placeholder="책에서 마음에 남은 문장을 입력해주세요."
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              maxLength={500}
            />

            <Text
              style={styles.characterCount}
            >
              {content.length} / 500
            </Text>

            <Text style={styles.inputLabel}>
              페이지
            </Text>

            <TextInput
              style={styles.pageInput}
              placeholder="예: 42"
              value={pageNumber}
              onChangeText={setPageNumber}
              keyboardType="number-pad"
            />

            <TouchableOpacity
              style={[
                styles.saveButton,
                isSaving &&
                  styles.disabledButton,
              ]}
              disabled={isSaving}
              onPress={
                handleCreateSentence
              }
            >
              {isSaving ? (
                <ActivityIndicator />
              ) : (
                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  저장하기
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SentenceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8f3',
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
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf8f3',
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

  addHeaderButton: {
    width: 34,
    alignItems: 'center',
  },

  addHeaderText: {
    fontSize: 27,
  },

  scrollContent: {
    padding: 20,
    paddingTop: 5,
    paddingBottom: 40,
  },

  heroCard: {
    backgroundColor: '#f2eadc',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },

  heroEmoji: {
    fontSize: 38,
  },

  heroContent: {
    flex: 1,
    marginLeft: 14,
  },

  heroTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  heroDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  countText: {
    fontSize: 13,
  },

  sentenceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },

  quote: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#4f7658',
    height: 25,
  },

  sentenceContent: {
    fontSize: 14,
    lineHeight: 23,
    marginTop: 4,
  },

  sentenceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
  },

  pageText: {
    fontSize: 12,
    color: '#777777',
  },

  deleteText: {
    fontSize: 12,
    color: '#a74b4b',
  },

  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 35,
    alignItems: 'center',
  },

  emptyEmoji: {
    fontSize: 40,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },

  emptyDescription: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },

  addButton: {
    borderWidth: 1,
    borderColor: '#4f7658',
    borderRadius: 22,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 15,
  },

  addButtonText: {
    color: '#4f7658',
    fontWeight: 'bold',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-end',
  },

  modalContainer: {
    backgroundColor: '#faf8f3',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 22,
    paddingBottom: 35,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },

  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
  },

  closeText: {
    fontSize: 28,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  sentenceInput: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    height: 120,
    padding: 14,
    fontSize: 14,
  },

  characterCount: {
    textAlign: 'right',
    fontSize: 11,
    marginTop: 5,
    marginBottom: 15,
  },

  pageInput: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 22,
  },

  saveButton: {
    backgroundColor: '#4f7658',
    borderRadius: 22,
    paddingVertical: 14,
    alignItems: 'center',
  },

  disabledButton: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
