/** 알림 설정 (PUT /api/me/reminder-settings) */
export interface ReminderSettings {
  enabled: boolean;
  /** 켜면 모든 요일의 이른 아침·늦은 저녁 알림(4번 주말 아침, 2번 연속 독서)을 보내지 않는다 */
  earlyLateMuted: boolean;
  weeklyGoalMinutes: number;
}

/** 알림용 상태 (GET /api/me/reminder-status). 날짜는 한국 날짜 'YYYY-MM-DD' */
export interface ReminderStatus {
  today: string;
  weekStart: string;
  readToday: boolean;
  weekReadDates: string[];
  todayMinutes: number;
  weekMinutes: number;
  /** 놓친 날을 방어권으로 처리한 뒤의 연속 일수 (오늘 기록이 없으면 어제까지) */
  currentStreak: number;
  ownedShieldCount: number;
  nickname: string;
  settings: ReminderSettings;
}

/**
 * 알림 번호 (스펙 014 알림 목록)
 * 1 저녁 · 2 연속 독서 · 3 복귀 · 4 주말 아침 · 5 주간 목표 임박 · 6 주간 마무리 · 7 미접속
 */
export type ReminderKind = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface PlannedReminder {
  /** `reminder:<번호>:<YYYY-MM-DD>` */
  id: string;
  kind: ReminderKind;
  date: Date;
  title: string;
  body?: string;
}
