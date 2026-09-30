import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { getRewards } from '../../api/rewardApi';

interface Reward {
  level: number;
  experience: number;
  currency: number;
  dday: number;
}

const RewardScreen = ({ navigation }: any) => {
  const [reward, setReward] = useState<Reward | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadRewards = async () => {
    try {
      setIsLoading(true);

      const data = await getRewards();

      setReward(data);
    } catch (error) {
      console.error('보상 정보 조회 실패:', error);

      Alert.alert(
        '조회 실패',
        '보상 정보를 불러오지 못했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRewards();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          보상 정보를 불러오는 중...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>나의 보상</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>현재 레벨</Text>

        <Text style={styles.value}>
          Level {reward?.level ?? 0}
        </Text>

        <Text style={styles.label}>경험치</Text>

        <Text>
          {reward?.experience ?? 0} XP
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>보유 재화</Text>

        <Text style={styles.value}>
          {reward?.currency ?? 0} Coin
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>D-day</Text>

        <Text style={styles.value}>
          D-{reward?.dday ?? 0}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Quest')}
      >
        <Text style={styles.buttonText}>
          퀘스트 보기
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Shop')}
      >
        <Text style={styles.buttonText}>
          상점
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default RewardScreen;

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
    marginBottom: 15,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  value: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  label: {
    marginTop: 10,
    marginBottom: 5,
  },

  button: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    alignItems: 'center',
  },

  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
