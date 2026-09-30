import axios from 'axios';

const API_URL = 'http://서버주소:8080/api';

// 내 보상 정보 조회
export const getReward = async () => {
  const response = await axios.get(
    `${API_URL}/rewards`
  );

  return response.data;
};

// 퀘스트 목록 조회
export const getQuests = async () => {
  const response = await axios.get(
    `${API_URL}/quests`
  );

  return response.data;
};

// 상점 아이템 구매
export const purchaseItem = async (
  itemId: number
) => {
  const response = await axios.post(
    `${API_URL}/shop/items/${itemId}/purchase`
  );

  return response.data;
};
