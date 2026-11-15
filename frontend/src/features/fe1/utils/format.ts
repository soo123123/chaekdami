/** 순수 포맷/계산 보조 함수 */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 진행률(0~100). 전체 페이지를 모르면 null */
export function calcProgress(currentPage: number, totalPages?: number): number | null {
  if (!totalPages || totalPages <= 0) return null;
  return clamp(Math.round((currentPage / totalPages) * 100), 0, 100);
}

/** 00:25:17 */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

/** 1시간 20분 / 35분 / 0분 */
export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  if (m === 0 && safe > 0) return '1분 미만';
  return `${m}분`;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Date → yyyy-MM-dd (로컬 기준, ISO 8601 날짜) */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** yyyy-MM-dd(또는 ISO 일시) → Date(로컬 자정) */
export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** ISO → 2025.10.01 */
export function formatDate(value?: string): string {
  if (!value) return '-';
  const date = parseIsoDate(value);
  if (!date) return value;
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** ISO → 2025.10.01 (수) */
export function formatDateWithWeekday(value: string): string {
  const date = parseIsoDate(value);
  if (!date) return value;
  return `${formatDate(value)} (${WEEKDAYS[date.getDay()]})`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

/** 숫자 문자열만 남긴다 */
export function digitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

export function isValidIsbn(value: string): boolean {
  const digits = digitsOnly(value);
  return digits.length === 10 || digits.length === 13;
}
