import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

import {
  getSentences,
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

  const readingRecordId =
    Number(params.readingRecordId) || 1;
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 저장된 문장 목록 조회
  const loadSentences = async () => {
    try {
      setIsLoading(true);

      const data = await getSentences(readingRecordId);

      setSentences(data);
    } catch (error) {
      console.error('문장 조회 실패:', error);

      Alert.alert(
        '조회 실패',
        '저장한 문장을 불러오지 못했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 문장 삭제
  const handleDelete = (sentenceId: number) => {
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
              await deleteSentence(sentenceId);

              // 화면에서도 삭제
              setSentences((current) =>
                current.filter(
                  (sentence) => sentence.id !== sentenceId
                )
              );

              Alert.alert(
                '삭제 완료',
                '문장이 삭제되었습니다.'
              );
            } catch (error) {
              console.error('문장 삭제 실패:', error);

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

  useEffect(() => {
    loadSentences();
  }, [readingRecordId]);

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
      <Text style={styles.title}>
        문장 모음
      </Text>

      {sentences.length === 0 ? (
        <View style={styles.center}>
          <Text>
            저장한 문장이 없습니다.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sentences}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.content}>
                "{item.content}"
              </Text>

              <Text style={styles.page}>
                {item.pageNumber} 페이지
              </Text>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id)}
              >
                <Text>
                  삭제
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default SentenceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  card: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
  },

  content: {
    fontSize: 16,
    lineHeight: 23,
  },

  page: {
    marginTop: 10,
    fontSize: 14,
  },

  deleteButton: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },
});
