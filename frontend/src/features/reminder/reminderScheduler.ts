import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getAccessToken } from '@/utils/tokenStorage';
import { buildReminderPlan, toKey } from './buildReminderPlan';
import { getReminderStatus } from './reminderApi';
import type { PlannedReminder } from './types';

/**
 * 독서 알림 예약·취소 (스펙 014 R1~R3, R8). 우리 알림만 identifier "reminder:"로 구분한다.
 * 웹은 로컬 알림을 쓰지 않는다.
 */

export const REMINDER_CHANNEL_ID = 'reading-reminder';
const ID_PREFIX = 'reminder:';
const GOAL_NEAR_DATE_KEY = 'reminder.goalNearDate';
/** 개발용: 하루를 이 초로 줄여 예약한다 (R8.7). 실제 빌드에서는 무시한다 */
const DEV_DAY_SECONDS = __DEV__ ? Number(process.env.EXPO_PUBLIC_REMINDER_DAY_SECONDS) || 0 : 0;
const DAY_MS = 24 * 60 * 60 * 1000;

const isSupported = Platform.OS !== 'web';

let readingInProgress = false;
let running: Promise<void> | null = null;
let rerunRequested = false;

/**
 * 서버 값을 받아 우리 알림을 모두 취소하고 다시 예약한다 (R1.2, R2).
 * 실행 중에 또 부르면 끝난 뒤 한 번만 더 실행한다 (R1.3).
 */
export function rescheduleReminders(): Promise<void> {
  if (!isSupported) return Promise.resolve();
  if (running) {
    rerunRequested = true;
    return running;
  }
  running = (async () => {
    do {
      rerunRequested = false;
      await rescheduleOnce();
    } while (rerunRequested);
  })().finally(() => {
    running = null;
  });
  return running;
}

/** 독서를 시작하면 오늘의 1·2·4번을 취소하고, 독서 화면이 열려 있는 동안 다시 만들지 않는다 (R8.3) */
export async function markReadingStarted(): Promise<void> {
  readingInProgress = true;
  if (!isSupported) return;
  const todayKey = toKey(new Date());
  await cancelWhere(id => [1, 2, 4].some(kind => id === `${ID_PREFIX}${kind}:${todayKey}`));
}

/** 독서 화면을 벗어나면 다시 예약한다. 저장했으면 서버 값에 오늘 읽음이 들어 있다 */
export function markReadingStopped(): Promise<void> {
  readingInProgress = false;
  return rescheduleReminders();
}

/** 로그아웃·탈퇴·세션 만료 때 우리 알림을 모두 취소한다 (R3) */
export async function cancelAllReminders(): Promise<void> {
  if (!isSupported) return;
  await cancelWhere(() => true);
}

/** 권한을 아직 정하지 않았으면 묻고, 받으면 바로 예약한다 (R8.5) */
export async function requestReminderPermissionIfNeeded(): Promise<void> {
  if (!isSupported) return;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (__DEV__) {
      console.log('[Reminder] 권한 요청 확인:', current.status, `canAskAgain=${current.canAskAgain}`);
    }
    if (!current.canAskAgain || isGranted(current) || current.status !== 'undetermined') return;
    await ensureReminderChannel(); // Android 13은 채널이 있어야 권한 창이 뜬다
    const result = await Notifications.requestPermissionsAsync();
    if (__DEV__) console.log('[Reminder] 권한 요청 결과:', result.status);
    if (isGranted(result)) await rescheduleReminders();
  } catch (error) {
    console.warn('[Reminder] 알림 권한 요청 실패:', error);
  }
}

/** 지금 알림 권한이 있는지 (설정 화면 안내용) */
export async function hasReminderPermission(): Promise<boolean> {
  if (!isSupported) return false;
  return isGranted(await Notifications.getPermissionsAsync());
}

/**
 * Android 알림 채널을 만든다. 만들 수 없으면(Expo Go 등) false를 돌려주고, 기본 채널로 예약한다.
 * 채널이 없어도 권한 요청과 예약은 계속한다.
 */
export async function ensureReminderChannel(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: '독서 알림',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    return true;
  } catch (error) {
    if (__DEV__) console.log('[Reminder] 알림 채널을 만들 수 없어 기본 채널 사용:', String(error));
    return false;
  }
}

async function rescheduleOnce(): Promise<void> {
  try {
    if (!(await getAccessToken())) {
      await cancelAllReminders();
      return;
    }
    const permission = await Notifications.getPermissionsAsync();
    if (!isGranted(permission)) {
      if (__DEV__) console.log('[Reminder] 알림 권한 없음, 예약 안 함:', permission.status);
      return;
    }

    // 조회가 실패하면 기존 예약을 그대로 둔다 (R8.4)
    const status = await getReminderStatus();
    const goalNearDate = await readGoalNearDate();
    const now = new Date();
    const plan = buildReminderPlan({ status, now, goalNearDate, readingInProgress });

    const channelReady = await ensureReminderChannel();
    await cancelAllReminders();
    for (const reminder of plan) {
      await schedule(reminder, now, channelReady);
    }
    if (__DEV__) logPlan(plan, now);
    const goalNear = plan.find(reminder => reminder.kind === 5);
    if (goalNear) await writeGoalNearDate(toKey(goalNear.date));
  } catch (error) {
    console.warn('[Reminder] 알림 예약 실패, 기존 예약 유지:', error);
  }
}

async function schedule(reminder: PlannedReminder, now: Date, channelReady: boolean): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: reminder.id,
    content: { title: reminder.title, ...(reminder.body ? { body: reminder.body } : {}) },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: scaledForDev(reminder.date, now),
      ...(channelReady ? { channelId: REMINDER_CHANNEL_ID } : {}),
    },
  });
}

/** 개발용 줄이기: 지금부터의 간격을 하루 = DEV_DAY_SECONDS 비율로 줄인다 */
function scaledForDev(date: Date, now: Date): Date {
  if (!DEV_DAY_SECONDS) return date;
  const ratio = (DEV_DAY_SECONDS * 1000) / DAY_MS;
  return new Date(now.getTime() + (date.getTime() - now.getTime()) * ratio);
}

/** 개발용: 예약한 알림과 실제로 울릴 시각(줄이기 적용)을 로그로 남긴다 */
function logPlan(plan: PlannedReminder[], now: Date): void {
  const lines = plan.map(reminder => {
    const seconds = Math.round((scaledForDev(reminder.date, now).getTime() - now.getTime()) / 1000);
    return `  ${reminder.id} → ${seconds}초 뒤 | ${reminder.title}`;
  });
  console.log(`[Reminder] ${plan.length}개 예약 (하루=${DEV_DAY_SECONDS || '실제'}초)\n${lines.join('\n')}`);
}

async function cancelWhere(match: (identifier: string) => boolean): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const request of scheduled) {
      if (request.identifier.startsWith(ID_PREFIX) && match(request.identifier)) {
        await Notifications.cancelScheduledNotificationAsync(request.identifier);
      }
    }
  } catch (error) {
    console.warn('[Reminder] 알림 취소 실패:', error);
  }
}

function isGranted(permission: Notifications.NotificationPermissionsStatus): boolean {
  return (
    permission.granted ||
    permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

async function readGoalNearDate(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(GOAL_NEAR_DATE_KEY);
  } catch {
    return null;
  }
}

async function writeGoalNearDate(key: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(GOAL_NEAR_DATE_KEY, key);
  } catch {
    // 저장하지 못하면 같은 주에 한 번 더 갈 수 있다. 예약은 그대로 둔다
  }
}
