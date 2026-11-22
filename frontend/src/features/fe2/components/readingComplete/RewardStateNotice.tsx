import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { CompleteRewardState } from '../../types/readingComplete';
import { COMPLETE_COLORS } from './theme';

type Props = { state: CompleteRewardState; onRetry?: () => void };

/**
 * 보상 영역의 로딩·실패 표시. 보상을 받는 중이거나 실패했을 때만 그린다.
 * 실패해도 화면의 다른 영역(독서 기록·독후감 버튼)은 그대로 쓸 수 있다.
 */
export function RewardStateNotice({ state, onRetry }: Props) {
  if (state === 'loading') {
    return (
      <View style={styles.box}>
        <ActivityIndicator size="small" color={COMPLETE_COLORS.green} />
        <Text style={styles.text}>보상을 받는 중이에요…</Text>
      </View>
    );
  }
  if (state === 'error') {
    return (
      <View style={styles.box}>
        <Text style={styles.text}>보상을 받지 못했어요. 네트워크를 확인하고 다시 시도해 주세요.</Text>
        {onRetry ? (
          <Pressable
            onPress={onRetry}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="보상 다시 받기"
          >
            <Text style={styles.buttonText}>다시 시도</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: COMPLETE_COLORS.paleGreen,
  },
  text: { flex: 1, fontSize: 13, color: COMPLETE_COLORS.text },
  button: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: COMPLETE_COLORS.green,
  },
  pressed: { opacity: 0.8 },
  buttonText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
});
