import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

const ReviewDetailScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>독후감 상세</Text>

      <View style={styles.card}>
        <Text style={styles.bookTitle}>
          책 제목
        </Text>

        <Text style={styles.rating}>
          평점: ★★★★★
        </Text>

        <Text style={styles.label}>
          한줄평
        </Text>

        <Text style={styles.text}>
          한줄평이 표시됩니다.
        </Text>

        <Text style={styles.label}>
          독후감
        </Text>

        <Text style={styles.text}>
          작성한 독후감 내용이 표시됩니다.
        </Text>
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>
          수정
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ReviewDetailScreen;

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
    padding: 20,
  },

  bookTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  rating: {
    fontSize: 16,
    marginBottom: 20,
  },

  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
  },

  text: {
    fontSize: 15,
    lineHeight: 22,
  },

  button: {
    marginTop: 20,
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
