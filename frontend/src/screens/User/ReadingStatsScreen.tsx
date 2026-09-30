import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { router } from 'expo-router';
import { getRewardStatus } from '../../api/rewardApi';

interface RewardStatus {
  level?: number;
  xp?: number;
  requiredXp?: number;
  currency?: number;
}

const RewardScreen = () => {
  const [reward, setReward] = useState<RewardStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadReward = async () => {
    try {
      setIsLoading(true);

      const data = await getRewardStatus();

      setReward(data);
    } catch (error) {
      console.error('보상 정보 조회 실패:', error);

      // 백엔드 연결 전 화면 테스트용 데이터
      setReward({
        level: 5,
        xp: 320,
        requiredXp: 500,
        currency: 1250,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReward();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          레벨 정보를 불러오는 중...
        </Text>
      </View>
    );
  }

  const level = reward?.level ?? 1;
  const xp = reward?.xp ?? 0;
  const requiredXp = reward?.requiredXp ?? 100;

  const progress =
    requiredXp > 0
      ? Math.min(xp / requiredXp, 1)
      : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* 상단 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
        >
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          레벨
        </Text>

        <View style={styles.headerSpace} />
      </View>

      {/* 현재 레벨 */}
      <View style={styles.levelCard}>
        <Text style={styles.smallTitle}>
          현재 레벨
        </Text>

        <View style={styles.levelRow}>
          <View style={styles.levelCircle}>
            <Text style={styles.levelNumber}>
              {level}
            </Text>
          </View>

          <View style={styles.levelInfo}>
            <Text style={styles.levelText}>
              Lv. {level}
            </Text>

            <Text style={styles.levelDescription}>
              꾸준히 독서하며 성장하고 있어요!
            </Text>
          </View>
        </View>

        {/* 경험치 */}
        <View style={styles.xpHeader}>
          <Text style={styles.xpLabel}>
            다음 레벨까지
          </Text>

          <Text style={styles.xpValue}>
            {xp} / {requiredXp} XP
          </Text>
        </View>

        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${progress * 100}%`,
              },
            ]}
          />
        </View>

        <Text style={styles.remainingText}>
          앞으로 {Math.max(requiredXp - xp, 0)} XP 남았어요
        </Text>
      </View>

      {/* 내 보유 재화 */}
      <View style={styles.currencyCard}>
        <View>
          <Text style={styles.currencyLabel}>
            보유 재화
          </Text>

          <Text style={styles.currencyValue}>
            🪙 {reward?.currency ?? 0}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.shopButton}
          onPress={() => router.push('/shop')}
        >
          <Text style={styles.shopButtonText}>
            상점 가기
          </Text>
        </TouchableOpacity>
      </View>

      {/* 레벨 보상 */}
      <Text style={styles.sectionTitle}>
        레벨 보상
      </Text>

      <View style={styles.rewardList}>
        <LevelReward
          level={level}
          title="현재 레벨"
          description="현재 달성한 레벨이에요."
          completed
        />

        <LevelReward
          level={level + 1}
          title="다음 레벨"
          description="재화 100개를 받을 수 있어요."
        />

        <LevelReward
          level={level + 2}
          title="레벨 보상"
          description="새로운 꾸미기 아이템이 열려요."
        />

        <LevelReward
          level={level + 3}
          title="레벨 보상"
          description="추가 보상을 획득할 수 있어요."
        />
      </View>

      {/* 퀘스트 */}
      <TouchableOpacity
        style={styles.questCard}
        onPress={() => router.push('/quest')}
      >
        <View>
          <Text style={styles.questTitle}>
            XP가 더 필요하신가요?
          </Text>

          <Text style={styles.questDescription}>
            퀘스트를 완료하고 경험치를 획득해 보세요.
          </Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

interface LevelRewardProps {
  level: number;
  title: string;
  description: string;
  completed?: boolean;
}

const LevelReward = ({
  level,
  title,
  description,
  completed = false,
}: LevelRewardProps) => {
  return (
    <View style={styles.rewardItem}>
      <View
        style={[
          styles.rewardLevelCircle,
          completed && styles.rewardLevelCompleted,
        ]}
      >
        <Text style={styles.rewardLevelText}>
          {completed ? '✓' : level}
        </Text>
      </View>

      <View style={styles.rewardContent}>
        <Text style={styles.rewardTitle}>
          Lv. {level} · {title}
        </Text>

        <Text style={styles.rewardDescription}>
          {description}
        </Text>
      </View>

      <Text style={styles.rewardIcon}>
        {completed ? '✅' : '🎁'}
      </Text>
    </View>
  );
};

export default RewardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8f3',
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  backButton: {
    fontSize: 34,
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
  },

  headerSpace: {
    width: 25,
  },

  levelCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 15,
  },

  smallTitle: {
    fontSize: 14,
    marginBottom: 15,
  },

  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  levelCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#e9f1e7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  levelNumber: {
    fontSize: 28,
    fontWeight: 'bold',
  },

  levelInfo: {
    marginLeft: 16,
    flex: 1,
  },

  levelText: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  levelDescription: {
    marginTop: 5,
    fontSize: 13,
  },

  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
    marginBottom: 8,
  },

  xpLabel: {
    fontSize: 13,
  },

  xpValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },

  progressBackground: {
    height: 10,
    backgroundColor: '#eeeeee',
    borderRadius: 5,
    overflow: 'hidden',
  },

  progressBar: {
    height: '100%',
    backgroundColor: '#4f7658',
    borderRadius: 5,
  },

  remainingText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
  },

  currencyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  currencyLabel: {
    fontSize: 13,
  },

  currencyValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },

  shopButton: {
    backgroundColor: '#4f7658',
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 20,
  },

  shopButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  rewardList: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 15,
    marginBottom: 20,
  },

  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },

  rewardLevelCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#eeeeee',
    justifyContent: 'center',
    alignItems: 'center',
  },

  rewardLevelCompleted: {
    backgroundColor: '#dfeee1',
  },

  rewardLevelText: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  rewardContent: {
    flex: 1,
    marginLeft: 12,
  },

  rewardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  rewardDescription: {
    fontSize: 12,
    marginTop: 4,
  },

  rewardIcon: {
    fontSize: 22,
  },

  questCard: {
    backgroundColor: '#f2eadc',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  questTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  questDescription: {
    fontSize: 12,
    marginTop: 5,
  },

  arrow: {
    fontSize: 25,
    marginLeft: 'auto',
  },
});
