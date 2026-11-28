
import apiClient from '@/api/apiClient';

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
  daily: ReadingStatItem[];
}

// 독서 통계 조회
// TODO: 백엔드 API 명세 확정 후 엔드포인트 확인
export const getReadingStats = async (): Promise<ReadingStats> => {
  try {
    const response = await apiClient.get<ReadingStats>(
      '/api/me/reading-stats'
    );

    return response.data;
  } catch (error) {
    console.error(
      '[ReadingStats API] 독서 통계 요청 실패',
      error
    );

    // 화면에서 API 실패를 감지해 처리하도록 전달
    throw error;
  }
};
