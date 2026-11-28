/** FE1 주간 랭킹 API 계층. 화면/Hook은 이 파일의 rankingApi만 사용한다. (서버: 스펙 005) */
import apiClient from '@/api/apiClient';
import { devMockRankingApi } from '@/features/fe1/api/devMockRankingApi';
import { RANKING_USE_DEV_MOCK } from '@/features/fe1/constants/config';
import type { RankingType, WeeklyRanking } from '@/features/fe1/types/ranking';

export interface RankingApi {
  getWeeklyRanking(type: RankingType): Promise<WeeklyRanking>;
}

const httpRankingApi: RankingApi = {
  async getWeeklyRanking(type) {
    if (type === 'experience') {
      const { data } = await apiClient.get<WeeklyRanking>('/api/rewards/rankings/weekly/experience');
      return data;
    }
    const { data } = await apiClient.get<WeeklyRanking>('/api/rewards/rankings/weekly/reading-time');
    return data;
  },
};

export const rankingApi: RankingApi = RANKING_USE_DEV_MOCK ? devMockRankingApi : httpRankingApi;
