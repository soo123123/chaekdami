
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { getQuests } from '../../api/rewardApi';

interface Quest {
  id: number;
  title: string;
  progress: number;
  targetValue: number;
  status: string;
  rewardCurrency: number;
  rewardExperience: number;
}

const QuestScreen = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadQuests = async () => {
    try {
      setIsLoading(true);

      const data = await getQuests();

      setQuests(data);
    } catch (error) {
      console.error('퀘스트 조회 실패:', error);

      Alert.alert(
        '조회 실패',
        '퀘스트를 불러오지 못했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuests();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          퀘스트를 불러오는 중...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        오늘의 퀘스트
      </Text>

      {quests.length === 0 ? (
        <View style={styles.center}>
          <Text>등록된 퀘스트가 없습니다.</Text>
        </View>
      ) : (
        <FlatList
          data={quests}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.questTitle}>
                {item.title}
              </Text>

              <Text style={styles.progress}>
                진행도: {item.progress} / {item.targetValue}
              </Text>

              <Text>
                상태: {item.status}
              </Text>

              <View style={styles.rewardBox}>
                <Text>
                  보상 Coin: {item.rewardCurrency}
                </Text>

                <Text>
                  보상 XP: {item.rewardExperience}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default QuestScreen;

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
    padding: 16,
    marginBottom: 12,
  },

  questTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  progress: {
    marginBottom: 5,
  },

  rewardBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#dddddd',
  },
});
