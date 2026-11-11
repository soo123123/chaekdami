import { StyleSheet, View } from 'react-native';
import { spacing } from '../../constants/theme';
import { FinishReadingButton, PauseButton, ReadingTimer } from './TimerControls';

/** 집중 모드 배경색. 헤더·상태바·화면 전체를 이 색으로 맞춘다. */
export const FOCUS_MODE_BACKGROUND = '#000000';

type FocusModeViewProps = {
  elapsedTime: number;
  isRunning: boolean;
  onTogglePause: () => void;
  onFinish: () => void;
};

/**
 * 독서 집중 모드 화면 본문.
 * 검정 화면에 아무것도 두지 않고, 경과 시간과 일시정지·종료 버튼만 화면 아래쪽에 모은다.
 */
export function FocusModeView({ elapsedTime, isRunning, onTogglePause, onFinish }: FocusModeViewProps) {
  const scale = 1.15;
  return (
    <View style={styles.container}>
      <View style={styles.bottom}>
        <ReadingTimer elapsedTime={elapsedTime} isRunning={isRunning} scale={scale} variant="dark" />
        <View style={[styles.controls, { gap: 56 * scale }]}>
          <PauseButton isRunning={isRunning} onPress={onTogglePause} scale={scale} variant="dark" />
          <FinishReadingButton elapsedTime={elapsedTime} onPress={onFinish} scale={scale} variant="dark" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  bottom: { alignItems: 'center', gap: spacing.xl, paddingBottom: spacing.md },
  controls: { flexDirection: 'row', justifyContent: 'center' },
});
