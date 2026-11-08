import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, softShadow, spacing } from '../../constants/theme';
import { formatClock } from '../../utils/format';
import { Icon } from '../common/Icon';

/** 경과 시간 표시 */
export function ReadingTimer({ elapsedTime, isRunning, scale = 1 }: { elapsedTime: number; isRunning: boolean; scale?: number }) {
  return (
    <View style={[styles.timerWrap, { gap: 8 * scale }]}>
      <View style={[styles.timerBox, { paddingHorizontal: 34 * scale, paddingVertical: 2 * scale }]}>
        <Text style={[styles.timer, { fontSize: 38 * scale }]} accessibilityRole="timer" accessibilityLabel={`경과 시간 ${formatClock(elapsedTime)}`}>
          {formatClock(elapsedTime)}
        </Text>
      </View>
      <View style={[styles.statusPill, { paddingVertical: 4 * scale }]}>
        <Icon name={isRunning ? 'leaf' : 'pause'} size={14 * scale} color={colors.primary} />
        <Text style={[styles.statusText, { fontSize: 13 * scale }]}>{isRunning ? '지금, 좋은 시간을 보내고 있어요.' : '잠시 쉬는 중이에요.'}</Text>
      </View>
    </View>
  );
}

/** 일시정지 / 재개 */
export function PauseButton({ isRunning, onPress, disabled, scale = 1 }: { isRunning: boolean; onPress: () => void; disabled?: boolean; scale?: number }) {
  const d = 50 * scale;
  return (
    <View style={styles.control}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isRunning ? '일시정지' : '이어서 읽기'}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [styles.circle, styles.pause, { width: d, height: d, borderRadius: d / 2 }, pressed && styles.pressed]}
      >
        <Icon name={isRunning ? 'pause' : 'play'} size={22 * scale} color="#4A4744" />
      </Pressable>
      <Text style={[styles.controlLabel, { fontSize: 14 * scale }]}>{isRunning ? '일시정지' : '이어서 읽기'}</Text>
    </View>
  );
}

/** 독서 종료 */
export function FinishReadingButton({ onPress, disabled, scale = 1 }: { onPress: () => void; disabled?: boolean; scale?: number }) {
  const h = 50 * scale;
  return (
    <View style={styles.control}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="독서 종료"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [styles.circle, styles.finish, { width: h * 1.25, height: h, borderRadius: h / 2 }, disabled && styles.disabled, pressed && styles.pressed]}
      >
        <View style={[styles.stopSquare, { width: 17 * scale, height: 17 * scale }]} />
      </Pressable>
      <Text style={[styles.controlLabel, { fontSize: 14 * scale }]}>독서 종료</Text>
    </View>
  );
}

/** 집중 모드 전환 */
export function FocusModeButton({ isFocusMode, onPress }: { isFocusMode: boolean; onPress: () => void }) {
  const tint = isFocusMode ? colors.onPrimary : colors.text;
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: isFocusMode }}
      accessibilityLabel="집중 모드"
      onPress={onPress}
      style={[styles.focus, isFocusMode && styles.focusOn]}
    >
      <Icon name="focus" size={18} color={tint} />
      <Text style={[styles.focusLabel, { color: tint }]}>{isFocusMode ? '집중 모드 해제' : '집중 모드'}</Text>
      {!isFocusMode ? <Icon name="chevronRight" size={15} color={tint} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  timerWrap: { alignItems: 'center', gap: spacing.sm + 2 },
  timerBox: { backgroundColor: 'rgba(255,252,247,0.94)', borderRadius: 999, paddingHorizontal: spacing.xl + 16, paddingVertical: spacing.xs + 2, ...softShadow },
  timer: { fontSize: 48, fontWeight: '700', color: colors.primary, fontVariant: ['tabular-nums'], letterSpacing: 1 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(232, 238, 228, 0.92)', borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2 },
  statusText: { fontSize: 14, color: '#3E5A48' },
  control: { alignItems: 'center', gap: spacing.xs + 2 },
  circle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  pause: { backgroundColor: 'rgba(255,252,247,0.96)', ...softShadow },
  finish: { backgroundColor: '#DD5D4A', ...softShadow },
  stopSquare: { width: 26, height: 26, borderRadius: 5, backgroundColor: '#FFFFFF' },
  controlLabel: { fontSize: 15, color: colors.text, fontWeight: '600' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
  focus: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 42, paddingHorizontal: spacing.md, borderRadius: 999, backgroundColor: colors.surface, ...softShadow },
  focusOn: { backgroundColor: colors.primary },
  focusLabel: { fontSize: 15, fontWeight: '600' },
});
