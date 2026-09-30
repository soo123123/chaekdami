import apiClient from './apiClient';

export interface DdayGoal {
  id: number;
  title: string;
  targetDate: string;
  remainingDays: number;
}

// D-day 목록 조회
// TODO: 백엔드 API 명세 확정 후 주소 확인
export const getDdayGoals = async () => {
  const response = await apiClient.get(
    '/ddays'
  );

  return response.data;
};

// D-day 등록
// TODO: 백엔드 API 명세 확정 후 주소 확인
export const createDdayGoal = async (
  title: string,
  targetDate: string
) => {
  const response = await apiClient.post(
    '/ddays',
    {
      title,
      targetDate,
    }
  );

  return response.data;
};

// D-day 삭제
// TODO: 백엔드 API 명세 확정 후 주소 확인
export const deleteDdayGoal = async (
  id: number
) => {
  await apiClient.delete(
    `/ddays/${id}`
  );
};
