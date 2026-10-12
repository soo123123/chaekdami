import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import { Icon } from '../common/Icon';

/** 서재 꾸미기 화면으로 이동 (서재 화면의 '…' 메뉴 항목) */
export function LibraryCustomizeButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.item}>
      <Icon name="palette" size={22} />
      <Text style={styles.label}>서재 꾸미기</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, minHeight: 54, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  label: { fontSize: 16, fontWeight: '600', color: colors.text },
});
