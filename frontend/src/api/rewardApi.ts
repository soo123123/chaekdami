import apiClient from './apiClient';

export const getRewardStatus = async () => {
  const response = await apiClient.get(
    '/rewards'
  );

  return response.data;
};

export const getQuests = async () => {
  const response = await apiClient.get(
    '/quests'
  );

  return response.data;
};

export const purchaseItem = async (
  itemId: number
) => {
  const response = await apiClient.post(
    `/shop/items/${itemId}/purchase`
  );

  return response.data;
};
