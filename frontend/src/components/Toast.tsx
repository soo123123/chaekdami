import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * 앱 공용 상단 토스트.
 *
 * - 루트 레이아웃(src/app/_layout.tsx)에 <ToastHost />가 한 번 붙어 있다.
 * - 어느 화면에서든 showToast('저장이 완료되었습니다.') 로 띄운다.
 * - 화면 이동과 상관없이 유지되므로, 저장 후 다른 화면으로 이동하면서 띄워도 된다.
 */
export type ToastType = 'success' | 'error';
type ToastState = { id: number; message: string; type: ToastType };

const SHOW_DURATION = 2000;
let listener: ((toast: ToastState) => void) | null = null;
let nextId = 1;

export function showToast(message: string, type: ToastType = 'success') {
  listener?.({ id: nextId++, message, type });
}

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    listener = setToast;
    return () => {
      if (listener === setToast) listener = null;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    progress.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(SHOW_DURATION),
      Animated.timing(progress, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]);
    animation.start(({ finished }) => {
      if (finished) setToast(current => (current?.id === toast.id ? null : current));
    });
    return () => animation.stop();
  }, [toast, progress]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  return (
    <View pointerEvents="none" style={[styles.host, { top: insets.top + 8 }]}>
      <Animated.View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[
          styles.toast,
          {
            opacity: progress,
            transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
          },
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: isSuccess ? SUCCESS_COLOR : ERROR_COLOR }]}>
          <Ionicons name={isSuccess ? 'checkmark' : 'alert'} size={18} color="#FFFFFF" />
        </View>
        <Text style={styles.message}>{toast.message}</Text>
      </Animated.View>
    </View>
  );
}

const SUCCESS_COLOR = '#467459';
const ERROR_COLOR = '#C8573E';

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 1000, elevation: 1000 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 18,
    borderRadius: 999,
    backgroundColor: '#FFFCF7',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  iconCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  message: { fontSize: 15, fontWeight: '700', color: '#2B2B2B' },
});
