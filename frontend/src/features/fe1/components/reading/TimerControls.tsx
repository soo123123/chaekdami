import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MIN_READING_SECONDS } from '../../constants/config';
import { colors, softShadow, spacing } from '../../constants/theme';
import { formatClock } from '../../utils/format';
import { Icon } from '../common/Icon';

/** 경과 시간 표시 */
/** 'dark': 검정 배경(집중 모드)용 색 */
type Variant = 'default' | 'dark';

export function ReadingTimer({ elapsedTime, isRunning, scale = 1, variant = 'default' }: { elapsedTime: number; isRunning: boolean; scale?: number; variant?: Variant }) {
  const dark = variant === 'dark';
  return (
    <View style={[styles.timerWrap, { gap: 6 * scale }]}>
      <View style={[dark ? styles.timerBoxDark : styles.timerBox, { paddingHorizontal: 34 * scale, paddingVertical: 2 * scale }]}>
        <Text style={[styles.timer, { fontSize: 38 * scale }, dark && styles.timerDark]} accessibilityRole="timer" accessibilityLabel={`경과 시간 ${formatClock(elapsedTime)}`}>
          {formatClock(elapsedTime)}
        </Text>
      </View>
      <View style={[styles.statusPill, { paddingVertical: 2 * scale, paddingHorizontal: 12 * scale }, dark && styles.statusPillDark]}>
        <Icon name={isRunning ? 'leaf' : 'pause'} size={11 * scale} color={dark ? DARK.subText : colors.primary} />
        <Text style={[styles.statusText, { fontSize: 11.5 * scale }, dark && { color: DARK.subText }]}>{isRunning ? '지금, 좋은 시간을 보내고 있어요.' : '잠시 쉬는 중이에요.'}</Text>
      </View>
    </View>
  );
}

/** 일시정지 / 재개 */
export function PauseButton({ isRunning, onPress, disabled, scale = 1, variant = 'default' }: { isRunning: boolean; onPress: () => void; disabled?: boolean; scale?: number; variant?: Variant }) {
  const d = 50 * scale;
  const dark = variant === 'dark';
  return (
    <View style={styles.control}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isRunning ? '일시정지' : '이어서 읽기'}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [styles.circle, styles.pause, { width: d, height: d, borderRadius: d / 2 }, dark && styles.pauseDark, pressed && styles.pressed]}
      >
        <Icon name={isRunning ? 'pause' : 'play'} size={22 * scale} color={dark ? DARK.text : '#4A4744'} />
      </Pressable>
      <Text style={[styles.controlLabel, { fontSize: 14 * scale }, dark && { color: DARK.text }]}>{isRunning ? '일시정지' : '이어서 읽기'}</Text>
    </View>
  );
}

/** 독서 종료 — 최소 독서 시간(MIN_READING_SECONDS)이 지나야 누를 수 있다 */
export function FinishReadingButton({ elapsedTime, onPress, disabled, scale = 1, variant = 'default' }: { elapsedTime: number; onPress: () => void; disabled?: boolean; scale?: number; variant?: Variant }) {
  const h = 50 * scale;
  const dark = variant === 'dark';
  const remaining = MIN_READING_SECONDS - elapsedTime;
  const isLocked = remaining > 0;
  const isDisabled = disabled || isLocked;
  const label = isLocked ? `${Math.ceil(remaining / 60)}분 후 종료 가능` : '독서 종료';
  return (
    <View style={styles.control}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="독서 종료"
        accessibilityHint={isLocked ? `${Math.floor(MIN_READING_SECONDS / 60)}분 이상 읽어야 종료할 수 있어요.` : undefined}
        accessibilityState={{ disabled: isDisabled }}
        disabled={isDisabled}
        onPress={onPress}
        style={({ pressed }) => [styles.circle, styles.finish, { width: h * 1.25, height: h, borderRadius: h / 2 }, isDisabled && styles.disabled, pressed && styles.pressed]}
      >
        <View style={[styles.stopSquare, { width: 17 * scale, height: 17 * scale }]} />
      </Pressable>
      <Text style={[styles.controlLabel, { fontSize: 14 * scale }, dark && { color: DARK.text }, isLocked && styles.lockedLabel]}>{label}</Text>
    </View>
  );
}

/** 집중 모드 전환 */
export function FocusModeButton({ isFocusMode, onPress }: { isFocusMode: boolean; onPress: () => void }) {
  // 집중 모드에서는 검정 헤더 위에 놓이므로 어두운 반투명 버튼으로 보인다
  const tint = isFocusMode ? DARK.text : colors.text;
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

/** 집중 모드(검정 배경) 색 */
const DARK = { text: '#F2F2F2', subText: 'rgba(242,242,242,0.6)' } as const;

const styles = StyleSheet.create({
  timerWrap: { alignItems: 'center', gap: spacing.sm + 2 },
  timerBox: { backgroundColor: 'rgba(255,252,247,0.94)', borderRadius: 999, paddingHorizontal: spacing.xl + 16, paddingVertical: spacing.xs + 2, ...softShadow },
  timer: { fontSize: 48, fontWeight: '700', color: colors.primary, fontVariant: ['tabular-nums'], letterSpacing: 1 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(232, 238, 228, 0.92)', borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2 },
  statusPillDark: { backgroundColor: 'rgba(255,255,255,0.08)' },
  statusText: { fontSize: 14, color: '#3E5A48' },
  timerBoxDark: { borderRadius: 999 },
  timerDark: { color: DARK.text, fontWeight: '600' },
  pauseDark: { backgroundColor: 'rgba(255,255,255,0.14)', shadowOpacity: 0, elevation: 0 },
  control: { alignItems: 'center', gap: spacing.xs + 2 },
  circle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  pause: { backgroundColor: 'rgba(255,252,247,0.96)', ...softShadow },
  finish: { backgroundColor: '#DD5D4A', ...softShadow },
  stopSquare: { width: 26, height: 26, borderRadius: 5, backgroundColor: '#FFFFFF' },
  controlLabel: { fontSize: 15, color: colors.text, fontWeight: '600' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
  lockedLabel: { opacity: 0.6 },
  focus: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 42, paddingHorizontal: spacing.md, borderRadius: 999, backgroundColor: colors.surface, ...softShadow },
  focusOn: { backgroundColor: 'rgba(255,255,255,0.12)', shadowOpacity: 0, elevation: 0 },
  focusLabel: { fontSize: 15, fontWeight: '600' },
});
