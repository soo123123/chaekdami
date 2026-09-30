import apiClient from './apiClient';

export interface ReadingStatItem {
  label: string;
  minutes: number;
}

export interface ReadingStats {
  totalMinutes: number;
  averageMinutes: number;
  completedBooks: number;
  totalPages: number;
  readingDays: number;

  goalBooks: number;
  goalTarget: number;

  weekly: ReadingStatItem[];
  monthly: ReadingStatItem[];
}

// 독서 통계 조회
// TODO: BE1 API 명세 확정 후 주소 수정
export const getReadingStats = async () => {
  const response = await apiClient.get(
    '/reading-stats'
  );

  return response.data;
};
