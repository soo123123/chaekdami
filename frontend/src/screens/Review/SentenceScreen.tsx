import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SentenceScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>문장 모음</Text>
      <Text>저장한 문장을 확인하는 화면입니다.</Text>
    </View>
  );
};

export default SentenceScreen;

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
});
