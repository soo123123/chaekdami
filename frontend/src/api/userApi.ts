import axios from 'axios';

const API_URL = 'http://서버주소:8080/api';

// 로그인한 사용자 정보 조회
export const getMyProfile = async () => {
  const response = await axios.get(
    `${API_URL}/me`
  );

  return response.data;
};
