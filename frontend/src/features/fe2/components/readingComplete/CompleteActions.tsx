import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { COMPLETE_COLORS } from './theme';

type Props = { onHome: () => void; onContinue: () => void };

/** 하단 버튼 (홈으로 이동 / 계속 독서하기) + 하단 문구 */
export function CompleteActions({ onHome, onContinue }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          onPress={onHome}
          style={({ pressed }) => [styles.button, styles.homeButton, pressed && styles.pressed]}
        >
          <Text style={styles.homeText}>홈으로 이동</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onContinue}
          style={({ pressed }) => [styles.button, styles.continueButton, pressed && styles.pressed]}
        >
          <Text style={styles.continueText}>계속 독서하기</Text>
        </Pressable>
      </View>
      <View style={styles.footer}>
        <Icon name="leaf" size={15} color={COMPLETE_COLORS.green} />
        <Text style={styles.footerText}>매일의 꾸준함이 나를 성장하게 합니다.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 14 },
  row: { flexDirection: 'row', gap: 10 },
  button: { flex: 1, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  homeButton: { backgroundColor: COMPLETE_COLORS.greyButton, borderWidth: 1, borderColor: '#E2DDD5' },
  continueButton: { backgroundColor: COMPLETE_COLORS.green },
  pressed: { opacity: 0.85 },
  homeText: { fontSize: 16, fontWeight: '700', color: COMPLETE_COLORS.green },
  continueText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  footerText: { fontSize: 12, color: COMPLETE_COLORS.secondary },
});
