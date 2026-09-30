import apiClient from './apiClient';

// 내 보상 정보 조회
export const getRewardStatus = async () => {
  const response = await apiClient.get(
    '/rewards'
  );

  return response.data;
};

// 퀘스트 목록 조회
export const getQuests = async () => {
  const response = await apiClient.get(
    '/quests'
  );

  return response.data;
};

// 상점 아이템 구매
export const purchaseItem = async (
  itemId: number
) => {
  const response = await apiClient.post(
    `/shop/items/${itemId}/purchase`
  );

  return response.data;
};
