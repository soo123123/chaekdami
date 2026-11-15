import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import { Icon } from '../common/Icon';

/** 수동 등록 화면으로 이동 */
export function ManualRegisterButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="수동으로 등록하기" onPress={onPress} style={styles.button}>
      <Icon name="plus" size={20} color={colors.text} />
      <Text style={styles.label}>수동등록</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 40, paddingHorizontal: spacing.md - 2, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
});
