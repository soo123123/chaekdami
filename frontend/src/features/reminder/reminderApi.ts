import apiClient from '@/api/apiClient';
import type { ReminderSettings, ReminderStatus } from './types';

/** 알림 예약에 필요한 값을 한 번에 받는다 (스펙 014 R4.1) */
export async function getReminderStatus(): Promise<ReminderStatus> {
  const response = await apiClient.get<ReminderStatus>('/api/me/reminder-status');
  return response.data;
}

/** 알림 설정 저장. weeklyGoalMinutes는 30~3000 (R4.5) */
export async function saveReminderSettings(settings: ReminderSettings): Promise<ReminderSettings> {
  const response = await apiClient.put<ReminderSettings>('/api/me/reminder-settings', settings);
  return response.data;
}
