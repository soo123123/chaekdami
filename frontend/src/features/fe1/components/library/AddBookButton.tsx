import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import { Icon } from '../common/Icon';

type AddBookButtonProps = { onPress: () => void; width: number; height: number };

/** 서재에 새로운 책 추가 (책장 빈 칸) */
export function AddBookButton({ onPress, width, height }: AddBookButtonProps) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="책 추가하기" onPress={onPress} style={[styles.add, { width, height }]}>
      <View style={styles.circle}><Icon name="plus" size={20} color={colors.shelfWoodDark} /></View>
      <Text style={styles.label}>책 추가하기</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  add: { borderRadius: radius.cover + 2, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.55)', backgroundColor: 'rgba(0,0,0,0.1)', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  circle: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, color: '#FFFFFF', fontWeight: '700' },
});
