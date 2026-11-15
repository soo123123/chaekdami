import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

/** 완독한 책 상세에 표시하는 재독 안내 (조건부 UI) */
export function RereadingNotice() {
  return (
    <View style={styles.notice}>
      <Text style={styles.text}>완독한 책이에요. 다시 읽으면 새로운 독서 기록으로 쌓여요.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: { backgroundColor: colors.primarySoft, borderRadius: radius.input, padding: spacing.sm + 4 },
  text: { fontSize: 14, color: colors.primary, lineHeight: 20 },
});
