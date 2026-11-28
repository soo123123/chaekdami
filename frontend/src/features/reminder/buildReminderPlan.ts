import { ABSENCE_STAGES, reminderText, toContent } from './reminderMessages';
import type { PlannedReminder, ReminderKind, ReminderStatus } from './types';

/**
 * 예약할 독서 알림 목록을 만드는 순수 함수 (스펙 014 R1.1, R4.7, R4.8, R5~R8).
 *
 * - 앱을 열 때마다 다시 예약하므로 "마지막 접속 = 지금"이다. 미접속 규칙(R6.5) 때문에
 *   매일 알림(1·2·4·5·6번)은 오늘과 내일만, 그 뒤는 7번(2·4·6일째)과 3번(8·14·30일째)만 만든다.
 * - 내일 값은 "오늘 더 읽지 않는다"고 보고 계산한다 (R5.7).
 * - 시각은 기기 시간대로 만든다. 서버의 today(한국 날짜)를 기준 날짜로 쓴다 (design ⑤ 가정).
 */
export interface ReminderPlanInput {
  status: ReminderStatus;
  now: Date;
  /** 이번 주 5번(주간 목표 임박)을 예약했던 날 'YYYY-MM-DD'. 없으면 null */
  goalNearDate: string | null;
  /** 독서 화면이 열려 있으면 오늘의 1·2·4번을 만들지 않는다 (R8.3) */
  readingInProgress: boolean;
}

const TIMES: Record<ReminderKind, [number, number]> = {
  1: [20, 0],
  2: [21, 30],
  3: [20, 0],
  4: [9, 0],
  5: [19, 0],
  6: [18, 0],
  7: [20, 0],
};

/** 같은 날 1시간 안에 겹치면 낮은 쪽을 뺀다 (R6.6). 앞일수록 높다 */
const PRIORITY: ReminderKind[] = [7, 3, 2, 6, 5, 1, 4];
const MIN_GAP_MS = 60 * 60 * 1000;
const STREAK_MIN_DAYS = 2;
const GOAL_NEAR_MINUTES = 60;
const QUIET_START = 22 * 60 + 30; // 22:30
const QUIET_END = 8 * 60; // 08:00

const SATURDAY = 6;
const SUNDAY = 0;
const MONDAY = 1;

export function buildReminderPlan(input: ReminderPlanInput): PlannedReminder[] {
  const { status, now, goalNearDate, readingInProgress } = input;
  const { settings } = status;
  if (!settings.enabled) return []; // R4.7

  const today = parseDate(status.today);
  const tomorrow = addDays(today, 1);
  const plan: PlannedReminder[] = [];

  // ── 오늘 ──
  const todayDay = buildDay({
    date: today,
    read: status.readToday || readingInProgress,
    saturdayRead: today.getDay() === SUNDAY ? status.weekReadDates.includes(toKey(addDays(today, -1))) : false,
    streak: status.currentStreak,
    weekMinutes: status.weekMinutes,
    goalNearAllowed: !wasGoalNearSentThisWeek(goalNearDate, status.weekStart, status.today),
    input,
  });
  plan.push(...todayDay);
  // 오늘 5번이 이미 갔거나(오늘 예약했던 기록) 아직 갈 예정이면 내일은 보내지 않는다
  const goalNearPlannedToday =
    goalNearDate === status.today ||
    todayDay.some(reminder => reminder.kind === 5 && reminder.date.getTime() > now.getTime());

  // ── 내일 (오늘 더 읽지 않는다고 본다) ──
  const newWeekTomorrow = tomorrow.getDay() === MONDAY;
  const tomorrowStreak = status.readToday || status.ownedShieldCount > 0 ? status.currentStreak : 0;
  plan.push(
    ...buildDay({
      date: tomorrow,
      read: false,
      saturdayRead: tomorrow.getDay() === SUNDAY ? status.readToday : false,
      streak: tomorrowStreak,
      weekMinutes: newWeekTomorrow ? 0 : status.weekMinutes,
      goalNearAllowed: newWeekTomorrow
        ? true
        : !goalNearPlannedToday && !wasGoalNearSentThisWeek(goalNearDate, status.weekStart, status.today),
      input,
    }),
  );

  // ── 미접속·복귀 (R6.5) ──
  for (const stage of ABSENCE_STAGES) {
    const date = atTime(addDays(today, stage.day), TIMES[stage.kind]);
    plan.push({ id: idOf(stage.kind, date), kind: stage.kind, date, title: stage.title, body: stage.body });
  }

  return plan
    .filter(reminder => reminder.date.getTime() > now.getTime()) // R8.1
    .filter(reminder => !isQuiet(reminder.date)) // R5.2
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

interface DayInput {
  date: Date;
  read: boolean;
  /** 일요일일 때 전날(토) 읽었는지 */
  saturdayRead: boolean;
  streak: number;
  weekMinutes: number;
  goalNearAllowed: boolean;
  input: ReminderPlanInput;
}

/** 하루치 매일 알림 (1·2·4·5·6번)과 그날의 겹침 규칙 */
function buildDay({ date, read, saturdayRead, streak, weekMinutes, goalNearAllowed, input }: DayInput): PlannedReminder[] {
  const { settings, nickname } = input.status;
  const day = date.getDay();
  const goal = settings.weeklyGoalMinutes;
  const remaining = goal - weekMinutes;
  const items: PlannedReminder[] = [];
  const add = (kind: ReminderKind, text: string) => {
    const at = atTime(date, TIMES[kind]);
    items.push({ id: idOf(kind, at), kind, date: at, ...toContent(text, nickname) });
  };

  // 4번 주말 아침: 토요일, 토요일에 안 읽었으면 일요일 (R6.4). 이른 아침 끄기 대상 (R4.8)
  const weekendMorning = day === SATURDAY || (day === SUNDAY && !saturdayRead);
  if (!read && weekendMorning && !settings.earlyLateMuted) add(4, reminderText.weekendMorning());

  // 6번 주간 마무리: 일요일 항상. 달성하면 축하, 아니면 독려 (R5.6)
  if (day === SUNDAY) {
    add(6, remaining <= 0 ? reminderText.weeklyAchieved(weekMinutes) : reminderText.weeklyShort(remaining));
  }

  // 5번 주간 목표 임박: 60분 이하 남음, 주 1회, 일요일은 6번이 대신 (R6.3)
  if (day !== SUNDAY && goalNearAllowed && remaining > 0 && remaining <= GOAL_NEAR_MINUTES) {
    add(5, reminderText.goalNear(remaining));
  }

  // 2번 연속 독서: 오늘 안 읽음, 연속 2일 이상 (방어권과 관계없이). 늦은 저녁 끄기 대상 (R4.8)
  const streakAlert = !read && streak >= STREAK_MIN_DAYS && !settings.earlyLateMuted;
  if (streakAlert) add(2, reminderText.streak(streak));

  // 1번 저녁: 오늘 안 읽음. 2번이 가는 날은 보내지 않음 (R6.1)
  if (!read && !streakAlert) add(1, reminderText.evening());

  return dropTooClose(items);
}

/** 1시간 안에 겹치면 우선순위가 낮은 쪽을 뺀다 (R6.6) */
function dropTooClose(items: PlannedReminder[]): PlannedReminder[] {
  const kept: PlannedReminder[] = [];
  const byPriority = [...items].sort((a, b) => PRIORITY.indexOf(a.kind) - PRIORITY.indexOf(b.kind));
  for (const item of byPriority) {
    const clash = kept.some(other => Math.abs(other.date.getTime() - item.date.getTime()) < MIN_GAP_MS);
    if (!clash) kept.push(item);
  }
  return kept;
}

/** 이번 주에 5번을 이미 예약했던 날이 오늘보다 앞이면 이번 주는 보냈다고 본다 */
function wasGoalNearSentThisWeek(goalNearDate: string | null, weekStart: string, today: string): boolean {
  if (!goalNearDate) return false;
  return goalNearDate >= weekStart && goalNearDate < today;
}

function isQuiet(date: Date): boolean {
  const minutes = date.getHours() * 60 + date.getMinutes();
  return minutes >= QUIET_START || minutes < QUIET_END;
}

function idOf(kind: ReminderKind, date: Date): string {
  return `reminder:${kind}:${toKey(date)}`;
}

export function parseDate(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function atTime(date: Date, [hours, minutes]: [number, number]): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
}
