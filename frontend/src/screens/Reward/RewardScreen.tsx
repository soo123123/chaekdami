import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

const RewardScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>나의 보상</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>현재 레벨</Text>
        <Text style={styles.value}>Level 1</Text>

        <Text style={styles.label}>경험치</Text>
        <Text style={styles.text}>0 XP</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>보유 재화</Text>
        <Text style={styles.value}>0 Coin</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>D-day</Text>
        <Text style={styles.value}>D-0</Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation?.navigate('Quest')}
      >
        <Text style={styles.buttonText}>
          퀘스트 보기
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation?.navigate('Shop')}
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
  },

  text: {
    marginTop: 5,
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
