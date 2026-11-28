/**
 * ⚠️ 개발 전용 예시 데이터 — 실제 순위가 아니다. 출시용 빌드에서는 쓰지 않는다 (config.ts).
 * 독서 시간은 공동 2위(내가 목록 안), 경험치는 내가 30위 밖인 경우를 보여준다.
 */
import type { RankingApi } from './rankingApi';
import type { RankingEntry, WeeklyRanking } from '../types/ranking';
import { toIsoDate } from '../utils/format';

const LATENCY_MS = 350;
const ME = { nickname: '다독왕', level: 5 };
const NAMES = ['책벌레', '밤독서', '새벽책방', '한장더', '종이냄새', '느린독자', '책갈피', '페이지터너'];

function thisWeek(): Pick<WeeklyRanking, 'weekStartDate' | 'weekEndDate'> {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  return { weekStartDate: toIsoDate(monday), weekEndDate: toIsoDate(sunday) };
}

function others(count: number, firstRank: number, scoreAt: (index: number) => number): RankingEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    rank: firstRank + i,
    nickname: `${NAMES[i % NAMES.length]}${i + 1}`,
    level: 1 + ((i * 5) % 12),
    score: scoreAt(i),
    me: false,
  }));
}

export const devMockRankingApi: RankingApi = {
  async getWeeklyRanking(type) {
    await new Promise(resolve => setTimeout(resolve, LATENCY_MS));
    if (type === 'readingTime') {
      const rankings: RankingEntry[] = [
        { rank: 1, nickname: '책벌레', level: 7, score: 31200, me: false },
        { rank: 2, ...ME, score: 22500, me: true },
        { rank: 2, nickname: '밤독서', level: 9, score: 22500, me: false },
        ...others(27, 4, i => 18120 - i * 660),
      ];
      return { ...thisWeek(), rankings, myRanking: { rank: 2, ...ME, score: 22500 } };
    }
    return { ...thisWeek(), rankings: others(30, 1, i => 1240 - i * 40), myRanking: { rank: 42, ...ME, score: 35 } };
  },
};
