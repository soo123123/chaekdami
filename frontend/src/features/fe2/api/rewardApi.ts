import apiClient from '@/api/apiClient';

type QuestType = 'DAILY' | 'WEEKLY';
type QuestStatus = 'IN_PROGRESS' | 'COMPLETED' | 'REWARDED';

interface QuestResult {
  userQuestId: number;
  questId: number;
  title: string;
  type: QuestType;
  targetValue: number;
  currentProgress: number;
  status: QuestStatus;
  rewardCurrency: number;
  rewardExperience: number;
}

interface RewardStatusResult {
  level: number;
  currentExperience: number;
  nextLevelExperience: number;
  experiencePercentage: number;
  currency: number;
  currentStreak: number;
  ownedShieldCount?: number;
  expBuffActive?: boolean;
  /** 부스터가 끝나는 시각 (서버 시간, 시간대 표기 없음). 적용 중이 아니면 null */
  expBuffExpiredAt?: string | null;
}

export interface QuestView {
  id: number;
  title: string;
  progress: number;
  target: number;
  rewardXp: number;
  rewardCurrency: number;
  completed: boolean;
  type: 'DDAY' | 'EXP';
}

export interface RewardStatusView {
  level: number;
  xp: number;
  requiredXp: number;
  currency: number;
  dday: number;
  /** 경험치 부스터 적용 중인지 */
  expBuffActive: boolean;
  /** 부스터가 끝나는 시각. 적용 중이 아니면 null */
  expBuffExpiredAt: string | null;
}

function toQuestView(quest: QuestResult): QuestView {
  return {
    id: quest.userQuestId,
    title: quest.title,
    progress: quest.currentProgress,
    target: quest.targetValue,
    rewardXp: quest.rewardExperience,
    rewardCurrency: quest.rewardCurrency,
    completed: quest.status === 'COMPLETED' || quest.status === 'REWARDED',
    type: quest.type === 'DAILY' ? 'DDAY' : 'EXP',
  };
}

export const getRewardStatus = async (): Promise<RewardStatusView> => {
  const response = await apiClient.get<RewardStatusResult>('/api/rewards');
  const data = response.data;

  return {
    level: data.level,
    xp: data.currentExperience,
    requiredXp: Math.max(1, data.nextLevelExperience),
    currency: data.currency,
    dday: data.currentStreak,
    expBuffActive: data.expBuffActive ?? false,
    expBuffExpiredAt: data.expBuffExpiredAt ?? null,
  };
};

export const getQuests = async (): Promise<QuestView[]> => {
  const response = await apiClient.get<QuestResult[]>('/api/quests');
  return response.data.map(toQuestView);
};

export interface ShopItemResult {
  id: number;
  name: string;
  price: number;
  type: 'SHIELD' | 'EXPERIENCE_BOOSTER';
  effectValue: number | null;
  bundle: number;
  ownedQuantity: number;
}

export interface PurchaseResult {
  remainingCurrency: number;
  updatedInventoryQuantity: number;
}

export const getShopItems = async (): Promise<ShopItemResult[]> => {
  const response = await apiClient.get<ShopItemResult[]>('/api/shop/items');
  return response.data;
};

export const purchaseItem = async (
  itemId: number,
  purchaseQuantity = 1
): Promise<PurchaseResult> => {
  const response = await apiClient.post<PurchaseResult>(
    `/api/shop/items/${itemId}/purchase`,
    { purchaseQuantity }
  );
  return response.data;
};

/* ------------------------------------------------------------------ */
/* 경험치 부스터                                                        */
/* ------------------------------------------------------------------ */

export interface BoosterUseResult {
  /** 부스터가 끝나는 시각 (이미 적용 중이었으면 30분 연장된 시각) */
  buffEndAt: string;
  /** 사용 후 남은 부스터 수 */
  remainingBoosters: number;
}

/** 보유한 경험치 부스터 1개를 사용한다. 30분 동안 독서 경험치 2배 (없으면 400 REWARD_006) */
export const activateExpBooster = async (): Promise<BoosterUseResult> => {
  const response = await apiClient.post<BoosterUseResult>('/api/rewards/boosters/use');
  return response.data;
};

/** 서버 시각 문자열("2026-11-20T21:30:00")에서 "21:30"만 꺼낸다 */
export function formatBuffEndTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /T(\d{2}):(\d{2})/.exec(value);
  return match ? `${match[1]}:${match[2]}` : null;
}

/* ------------------------------------------------------------------ */
/* 독서 완료 보상                                                       */
/* ------------------------------------------------------------------ */

export interface ReadingSessionRewardResult {
  readingSessionId: number;
  /** 이번 호출에서 기본 보상을 처리했는지. 이미 받은 세션이면 false (내역은 처음 받은 그대로 옴) */
  baseGranted: boolean;
  reading: { experience: number; boosted: boolean };
  photoBonus: { granted: boolean; experience: number; currency: number };
  completedQuests: {
    userQuestId: number;
    title: string | null;
    rewardCurrency: number;
    rewardExperience: number;
  }[];
  streak: {
    currentStreak: number;
    longestStreak: number;
    shieldsUsed: number;
    shieldRefunded: boolean;
  };
  /** 레벨업으로 받은 승급 재화 */
  promotionReward: number;
  levelBefore: number;
  level: number;
  leveledUp: boolean;
  /** 현재 레벨 구간 경험치 (지금 값) */
  currentExperience: number;
  nextLevelExperience: number;
  experiencePercentage: number;
  /** 처리 후 보유 재화 (지금 값) */
  currency: number;
}

/**
 * 독서 완료 보상을 받는다. 독서 경험치·퀘스트·D-day를 서버가 한 번에 처리한다.
 * 같은 세션으로 다시 불러도 다시 지급하지 않고 처음 받은 내역을 돌려준다.
 */
export const claimReadingSessionReward = async (
  readingSessionId: number
): Promise<ReadingSessionRewardResult> => {
  const response = await apiClient.post<ReadingSessionRewardResult>(
    `/api/rewards/reading-sessions/${readingSessionId}`
  );
  return response.data;
};
