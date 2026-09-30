import apiClient from './apiClient';
export const getSentences = async (readingRecordId: number) => {

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
  const response = await axios.get(
    `${API_URL}/reading-records/${readingRecordId}/review`
  );

  return response.data;
};
