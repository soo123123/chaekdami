import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { onTokensCleared } from '@/utils/tokenStorage';
import { cancelAllReminders, rescheduleReminders } from './reminderScheduler';

/**
 * 루트 레이아웃에 붙어 독서 알림을 맞춘다 (스펙 014 R2.3, R3, R8.3).
 * - 앱 시작과 화면 복귀 때 다시 예약
 * - 토큰이 지워지면(로그아웃·탈퇴·세션 만료) 모두 취소
 * - 앱을 보고 있을 때 온 알림은 표시하지 않음
 */
export function ReminderSync() {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    const removeTokenListener = onTokensCleared(() => {
      void cancelAllReminders();
    });
    void rescheduleReminders();
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') void rescheduleReminders();
    });

    return () => {
      subscription.remove();
      removeTokenListener();
    };
  }, []);

  return null;
}
