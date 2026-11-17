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
  records: Record<string, 'read' | 'protected'>;
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

export async function saveDday(snapshot: {
  goals: DdayGoalInput[];
  records: DdaySnapshot['records'];
}): Promise<DdaySnapshot> {
  const response = await apiClient.put<DdaySnapshot>('/api/dday', snapshot);
  return response.data;
}
