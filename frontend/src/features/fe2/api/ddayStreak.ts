export type DdayRecordMap = Record<string, 'read' | 'protected'>;

function dateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shiftDate(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const next = new Date(year, (month ?? 1) - 1, day ?? 1);
  next.setDate(next.getDate() + days);
  return dateString(next);
}

function isActive(records: DdayRecordMap, date: string): boolean {
  return records[date] === 'read' || records[date] === 'protected';
}

/**
 * 달력 기록 집계 (읽은 날·방어한 날·유지한 날 수).
 * 연속 일수(currentStreak, longestStreak)는 서버 값(GET /api/dday)을 쓴다.
 * 여기서 계산하는 연속 일수는 방어한 날도 +1로 세서 서버와 다를 수 있으니 화면에 쓰지 않는다.
 */
export function summarizeDday(records: DdayRecordMap, today = dateString(new Date())) {
  const dates = Object.keys(records).filter((date) => isActive(records, date)).sort();

  let longestStreak = 0;
  let run = 0;
  let previous: string | null = null;
  let totalRead = 0;
  let totalProtected = 0;

  for (const date of dates) {
    if (records[date] === 'read') totalRead += 1;
    else totalProtected += 1;

    run = previous && shiftDate(previous, 1) === date ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    previous = date;
  }

  let currentStreak = 0;
  let cursor = isActive(records, today) ? today : shiftDate(today, -1);
  while (isActive(records, cursor)) {
    currentStreak += 1;
    cursor = shiftDate(cursor, -1);
  }

  return {
    totalRead,
    totalProtected,
    totalMaintained: totalRead + totalProtected,
    longestStreak,
    currentStreak,
  };
}
