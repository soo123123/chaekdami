import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HIT_SLOP } from '@/constants/layout';

type Props = {
  title: string;
  message: string;
  onRetry: () => void;
  onBack: () => void;
};

/** 조회에 실패해 보여줄 값이 없을 때의 화면 (예시 값으로 대신하지 않는다) */
export function LoadFailedView({ title, message, onRetry, onBack }: Props) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          hitSlop={HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
        >
          <Ionicons name="chevron-back" size={27} color="#29251F" />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          accessibilityRole="button"
        >
          <Text style={styles.retryText}>다시 불러오기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF7F1' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 14 },
  title: { fontSize: 20, fontWeight: '800', color: '#29251F' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  message: { fontSize: 15, color: '#77736C', textAlign: 'center' },
  retryButton: { paddingVertical: 11, paddingHorizontal: 22, borderRadius: 999, backgroundColor: '#365F49' },
  retryText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
});
