import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import { formatClock } from '../../utils/format';

/** 경과 시간 표시 */
export function ReadingTimer({ elapsedTime, isRunning }: { elapsedTime: number; isRunning: boolean }) {
  return (
    <View style={styles.timerWrap}>
      <View style={styles.timerBox}>
        <Text
          style={styles.timer}
          accessibilityRole="timer"
          accessibilityLabel={`경과 시간 ${formatClock(elapsedTime)}`}
        >
          {formatClock(elapsedTime)}
        </Text>
      </View>
      <View style={styles.statusPill}>
        <Text style={styles.statusText}>
          {isRunning ? '🌿 지금, 좋은 시간을 보내고 있어요.' : '⏸ 잠시 쉬는 중이에요.'}
        </Text>
      </View>
    </View>
  );
}

/** 일시정지 / 재개 */
export function PauseButton({ isRunning, onPress, disabled }: { isRunning: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <View style={styles.control}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isRunning ? '일시정지' : '이어서 읽기'}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [styles.circle, styles.pause, pressed && styles.pressed]}
      >
        <Text style={styles.pauseGlyph}>{isRunning ? 'Ⅱ' : '▶'}</Text>
      </Pressable>
      <Text style={styles.controlLabel}>{isRunning ? '일시정지' : '이어서 읽기'}</Text>
    </View>
  );
}

/** 독서 종료 */
export function FinishReadingButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  return (
    <View style={styles.control}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="독서 종료"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [styles.circle, styles.finish, disabled && styles.disabled, pressed && styles.pressed]}
      >
        <View style={styles.stopSquare} />
      </Pressable>
      <Text style={styles.controlLabel}>독서 종료</Text>
    </View>
  );
}

/** 집중 모드 전환 */
export function FocusModeButton({ isFocusMode, onPress }: { isFocusMode: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: isFocusMode }}
      accessibilityLabel="집중 모드"
      onPress={onPress}
      style={[styles.focus, isFocusMode && styles.focusOn]}
    >
      <Text style={[styles.focusLabel, isFocusMode && styles.focusLabelOn]}>
        {isFocusMode ? '◉ 집중 모드 해제' : '◎ 집중 모드 ›'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  timerWrap: { alignItems: 'center', gap: spacing.sm },
  timerBox: { backgroundColor: 'rgba(255,249,242,0.92)', borderRadius: 999, paddingHorizontal: spacing.xl + 8, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border },
  timer: { fontSize: 46, fontWeight: '700', color: colors.primary, fontVariant: ['tabular-nums'], letterSpacing: 1 },
  statusPill: { backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2 },
  statusText: { fontSize: 13, color: colors.primary },
  control: { alignItems: 'center', gap: spacing.sm },
  circle: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  pause: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  pauseGlyph: { fontSize: 26, color: colors.text, fontWeight: '700' },
  finish: { backgroundColor: colors.danger },
  stopSquare: { width: 24, height: 24, borderRadius: 4, backgroundColor: '#FFFFFF' },
  controlLabel: { fontSize: 14, color: colors.text, fontWeight: '600' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
  focus: { minHeight: 40, paddingHorizontal: spacing.md, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' },
  focusOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  focusLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  focusLabelOn: { color: colors.onPrimary },
});
