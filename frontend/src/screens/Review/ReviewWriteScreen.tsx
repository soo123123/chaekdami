import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

const ReviewWriteScreen = () => {
  const [rating, setRating] = useState('');
  const [oneLine, setOneLine] = useState('');
  const [content, setContent] = useState('');

  const handleSave = () => {
    if (!content.trim()) {
      Alert.alert('알림', '독후감을 작성해주세요.');
      return;
    }

    Alert.alert('저장 완료', '독후감이 저장되었습니다.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>독후감 작성</Text>

      <Text style={styles.label}>평점</Text>

      <TextInput
        style={styles.input}
        value={rating}
        onChangeText={setRating}
        placeholder="1~5점"
        keyboardType="numeric"
      />

      <Text style={styles.label}>한줄평</Text>

      <TextInput
        style={styles.input}
        value={oneLine}
        onChangeText={setOneLine}
        placeholder="책에 대한 한줄평을 작성하세요."
      />

      <Text style={styles.label}>독후감</Text>

      <TextInput
        style={styles.contentInput}
        value={content}
        onChangeText={setContent}
        placeholder="책을 읽고 느낀 점을 작성하세요."
        multiline
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSave}
      >
        <Text style={styles.buttonText}>
          저장
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ReviewWriteScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
  },

  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },

  contentInput: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    padding: 12,
    height: 180,
    textAlignVertical: 'top',
    marginBottom: 20,
  },

  button: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },

  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
