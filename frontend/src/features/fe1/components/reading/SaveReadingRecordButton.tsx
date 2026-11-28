import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import { AppButton } from '../common/AppButton';
import { Icon } from '../common/Icon';

type SaveReadingRecordButtonProps = {
  onPress: () => void;
  isLoading: boolean;
  /** 인증 사진을 검증하는 중인지. 검증 중에는 회색으로 비활성화된다. */
  isVerifying?: boolean;
};

/**
 * - ready: 평소 버튼 (누를 수 있음)
 * - verifying: 사진 검증 중. 회색, 비활성화
 * - filling: 검증이 끝나 왼쪽부터 색이 채워지는 중. 다 채워질 때까지 비활성화
 */
type Phase = 'ready' | 'verifying' | 'filling';

const LABEL = '기록 저장하기';
const FILL_DURATION_MS = 500;
/** 웹은 native driver를 지원하지 않는다 */
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

/** 독서 기록 저장. 저장 중·사진 검증 중에는 비활성화되고, 검증이 끝나면 색이 채워지며 다시 활성화된다. */
export function SaveReadingRecordButton({ onPress, isLoading, isVerifying = false }: SaveReadingRecordButtonProps) {
  const [phase, setPhase] = useState<Phase>(isVerifying ? 'verifying' : 'ready');
  const [width, setWidth] = useState(0);
  // 렌더 중에도 읽으므로 ref가 아니라 state로 한 번만 만든다
  const [progress] = useState(() => new Animated.Value(isVerifying ? 0 : 1));

  // 화면을 벗어난 뒤 늦게 끝난 애니메이션이 상태를 바꾸지 않게 한다.
  const mountedRef = useRef(true);
  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  // 검증이 시작되면(채우는 중이었어도) 바로 회색으로, 검증 중이다가 끝나면 채우기를 시작한다 (렌더 중에 맞춤).
  const [wasVerifying, setWasVerifying] = useState(isVerifying);
  if (isVerifying !== wasVerifying) {
    setWasVerifying(isVerifying);
    if (isVerifying) setPhase('verifying');
    else if (phase === 'verifying') setPhase('filling');
  }
  useEffect(() => {
    if (!isVerifying) return;
    progress.stopAnimation();
    progress.setValue(0);
  }, [isVerifying, progress]);

  useEffect(() => {
    if (phase !== 'filling') return;
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: FILL_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    });
    // 중간에 멈추면(finished=false: 다시 검증 시작, 화면 이탈) 활성화하지 않는다.
    animation.start(({ finished }) => {
      if (finished && mountedRef.current) setPhase('ready');
    });
    return () => animation.stop();
  }, [phase, progress]);

  if (phase === 'ready') {
    return (
      <AppButton onPress={onPress} isLoading={isLoading} icon={<Icon name="save" size={24} color={colors.onPrimary} />}>
        {LABEL}
      </AppButton>
    );
  }

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={LABEL}
      accessibilityState={{ disabled: true, busy: phase === 'verifying' }}
      disabled
      onLayout={event => setWidth(event.nativeEvent.layout.width)}
      style={styles.button}
    >
      {/* 너비를 재기 전에는 채움 레이어를 그리지 않는다 (0이면 처음부터 꽉 차 보임) */}
      {width > 0 ? (
        <Animated.View pointerEvents="none" style={[styles.fill, { transform: [{ translateX }] }]} />
      ) : null}
      <View style={styles.row}>
        <Icon name="save" size={24} color={colors.onPrimary} />
        <Text style={styles.label}>{LABEL}</Text>
      </View>
    </Pressable>
  );
}

// AppButton(primary, lg)과 같은 크기·모양을 유지한다.
const styles = StyleSheet.create({
  button: {
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.button,
    backgroundColor: colors.tertiaryText,
    overflow: 'hidden',
  },
  fill: { ...StyleSheet.absoluteFill, backgroundColor: colors.primary },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { color: colors.onPrimary, fontSize: 18, fontWeight: '700' },
});
