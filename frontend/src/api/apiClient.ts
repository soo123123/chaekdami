import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://서버주소:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
