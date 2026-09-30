import apiClient from './apiClient';


// ========================================
// 문장 저장 관련 기능
// 현재 FE1 담당
// 기존 코드이므로 임의로 수정하지 않음
// ========================================

export const getSentences = async (
  readingRecordId: number
) => {
  const response = await axios.get(
    `${API_URL}/reading-records/${readingRecordId}/sentences`
  );

  return response.data;
};


export const createSentence = async (
  readingRecordId: number,
  content: string,
  pageNumber: number
) => {
  const response = await axios.post(
    `${API_URL}/reading-records/${readingRecordId}/sentences`,
    {
      content,
      pageNumber,
    }
  );

  return response.data;
};


export const deleteSentence = async (
  sentenceId: number
) => {
  await axios.delete(
    `${API_URL}/sentences/${sentenceId}`
  );
};


// ========================================
// 독후감 / 리뷰 관련 기능
// FE2 담당
// ========================================

// 독후감 작성
export const createReview = async (
  readingRecordId: number,
  content: string,
  rating: number,
  oneLine: string
) => {
  const response = await apiClient.post(
    `/reading-records/${readingRecordId}/review`,
    {
      content,
      rating,
      oneLine,
    }
  );

  return response.data;
};


// 리뷰 상세 조회
export const getReview = async (
  readingRecordId: number
) => {
  const response = await apiClient.get(
    `/reading-records/${readingRecordId}/review`
  );

  return response.data;
};
