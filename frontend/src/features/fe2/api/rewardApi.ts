
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
  ownedShieldCount: number;
  expBuffActive: boolean;
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
    completed:
      quest.status === 'COMPLETED' ||
      quest.status === 'REWARDED',
    type: quest.type === 'DAILY' ? 'DDAY' : 'EXP',
  };
}

export const getRewardStatus =
  async (): Promise<RewardStatusView> => {
    const response =
      await apiClient.get<RewardStatusResult>('/api/rewards');

    const data = response.data;

    return {
      level: data.level,
      xp: data.currentExperience,
      requiredXp: Math.max(1, data.nextLevelExperience),
      currency: data.currency,
      dday: data.currentStreak,
      ownedShieldCount: data.ownedShieldCount ?? 0,
      expBuffActive: data.expBuffActive ?? false,
      expBuffExpiredAt: data.expBuffExpiredAt ?? null,
    };
  };

export const getQuests = async (): Promise<QuestView[]> => {
  const response =
    await apiClient.get<QuestResult[]>('/api/quests');

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

export const getShopItems =
  async (): Promise<ShopItemResult[]> => {
    const response =
      await apiClient.get<ShopItemResult[]>('/api/shop/items');

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

export interface BoosterUseResult {
  buffEndAt: string;
  remainingBoosters: number;
}

// 부스터 사용을 다른 화면 요소(부스터 위젯)에 알린다
const boosterUsedListeners = new Set<() => void>();

export function subscribeBoosterUsed(
  listener: () => void
): () => void {
  boosterUsedListeners.add(listener);

  return () => {
    boosterUsedListeners.delete(listener);
  };
}

export const activateExpBooster =
  async (): Promise<BoosterUseResult> => {
    const response =
      await apiClient.post<BoosterUseResult>(
        '/api/rewards/boosters/use'
      );

    boosterUsedListeners.forEach((listener) => listener());

    return response.data;
  };

export function formatBuffEndTime(
  value: string | null | undefined
): string | null {
  if (!value) {
    return null;
  }

  const match = /T(\d{2}):(\d{2})/.exec(value);

  return match
    ? `${match[1]}:${match[2]}`
    : null;
}

export interface ReadingSessionRewardResult {
  readingSessionId: number;
  baseGranted: boolean;

  reading: {
    experience: number;
    boosted: boolean;
  };

  photoBonus: {
    granted: boolean;
    experience: number;
    currency: number;
  };

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

  promotionReward: number;
  levelBefore: number;
  level: number;
  leveledUp: boolean;
  currentExperience: number;
  nextLevelExperience: number;
  experiencePercentage: number;
  currency: number;
}

export const claimReadingSessionReward = async (
  readingSessionId: number
): Promise<ReadingSessionRewardResult> => {
  const response =
    await apiClient.post<ReadingSessionRewardResult>(
      `/api/rewards/reading-sessions/${readingSessionId}`
    );

  return response.data;
};
