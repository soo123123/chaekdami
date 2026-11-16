import apiClient from '@/api/apiClient';

export interface TodayReading {
  readingMinutes: number;
  pagesRead: number;
  memoCount: number;
}

export async function getTodayReading(): Promise<TodayReading> {
  const response = await apiClient.get<TodayReading>('/api/me/reading-today');
  return response.data;
}
