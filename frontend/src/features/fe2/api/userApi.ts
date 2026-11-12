import apiClient from '@/api/apiClient';

export const getMyProfile = async () => {
  const response = await apiClient.get(
    '/api/me'
  );

  return response.data;
};
