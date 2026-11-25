import apiClient from '@/api/apiClient';

export const getMyProfile = async () => {
  const response = await apiClient.get(
    '/api/me'
  );

  return response.data;
};

// 닉네임 변경
export const updateNickname = async (
  nickname: string
): Promise<{ nickname?: string }> => {
  const response = await apiClient.patch(
    '/api/me',
    { nickname }
  );

  return response.data;
};
