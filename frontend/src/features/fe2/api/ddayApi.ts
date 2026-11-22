import apiClient from '@/api/apiClient';

export interface DdayGoal {
  id: number;
  title: string;
  targetDate: string;
  targetBooks: number;
  completedBooks: number;
}

export interface DdaySnapshot {
  goals: DdayGoal[];
  /** 날짜별 기록. 서버만 기록한다 (읽음: 독서 완료 보상, 방어: 방어권 자동 차감) */
  records: Record<string, 'read' | 'protected'>;
  /** 서버가 계산한 현재 연속 일수 (읽은 날 +1, 방어한 날 +0). 화면에서 다시 계산하지 않는다 */
  currentStreak: number;
  /** 서버가 계산한 최고 연속 일수 */
  longestStreak: number;
}

export async function getDday(): Promise<DdaySnapshot> {
  const response = await apiClient.get<DdaySnapshot>('/api/dday');
  return response.data;
}

export interface DdayGoalInput {
  id?: number;
  title: string;
  targetDate: string;
  targetBooks: number;
  completedBooks: number;
}

/** 목표만 저장한다. 달력 기록은 서버가 쓰므로 보내지 않는다 (보내도 서버가 무시) */
export async function saveDday(snapshot: {
  goals: DdayGoalInput[];
}): Promise<DdaySnapshot> {
  const response = await apiClient.put<DdaySnapshot>('/api/dday', { goals: snapshot.goals });
  return response.data;
}
