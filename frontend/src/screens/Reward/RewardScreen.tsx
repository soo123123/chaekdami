
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { getRewardStatus } from '../../api/rewardApi';

interface RewardStatus {
  level?: number;
  xp?: number;
  requiredXp?: number;
  currency?: number;
}

const TEST_REWARD: RewardStatus = {
  level: 5,
  xp: 320,
  requiredXp: 500,
  currency: 1250,
};

export default function RewardScreen() {
  const [reward, setReward] = useState<RewardStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    let active = true;

    const loadReward = async () => {
      try {
        const data = await getRewardStatus();
        if (active) {
          setReward(data);
          setIsDemo(false);
        }
      } catch (error) {
        console.warn('보상 정보 조회 실패:', error);
        if (active) {
          setReward(TEST_REWARD);
          setIsDemo(true);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadReward();
    return () => {
      active = false;
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5E7D61" />
        <Text style={styles.muted}>보상 정보를 불러오는 중...</Text>
      </View>
    );
  }

  const level = reward?.level ?? 1;
  const xp = reward?.xp ?? 0;
  const requiredXp = reward?.requiredXp ?? 100;
  const currency = reward?.currency ?? 0;

  const progress =
    requiredXp > 0
      ? Math.max(0, Math.min(xp / requiredXp, 1))
      : 0;

  const remainingXp = Math.max(requiredXp - xp, 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>레벨 및 보상</Text>
        <View style={{ width: 28 }} />
      </View>

      {isDemo && (
        <Text style={styles.demoNotice}>
          현재 서버 연결 전 테스트 데이터를 표시하고 있어요.
        </Text>
      )}

      <View style={styles.levelCard}>
        <Text style={styles.eyebrow}>나의 독서 성장</Text>

        <View style={styles.levelRow}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>Lv.</Text>
            <Text style={styles.levelNumber}>{level}</Text>
          </View>

          <View style={styles.levelInfo}>
            <Text style={styles.levelTitle}>
              레벨 {level}
            </Text>
            <Text style={styles.levelSubtitle}>
              책과 함께 차곡차곡 성장하고 있어요.
            </Text>
          </View>
        </View>

        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>경험치</Text>
          <Text style={styles.progressValue}>
            {xp} / {requiredXp} XP
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` },
            ]}
          />
        </View>

        <Text style={styles.remaining}>
          다음 레벨까지 {remainingXp} XP 남았어요
        </Text>
      </View>

      <View style={styles.currencyCard}>
        <View>
          <Text style={styles.muted}>나의 보유 재화</Text>
          <Text style={styles.currencyValue}>
            🪙 {currency.toLocaleString()}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => router.push('/reward/shop')}
        >
          <Text style={styles.outlineButtonText}>
            상점 가기 ›
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>레벨 보상</Text>

      <View style={styles.rewardCard}>
        <RewardRow
          icon="✓"
          title={`Lv.${level} 현재 레벨`}
          description="현재 달성한 레벨이에요."
          completed
        />
        <View style={styles.separator} />
        <RewardRow
          icon="🎁"
          title={`Lv.${level + 1} 다음 레벨`}
          description="다음 레벨에서 받을 보상을 확인해 보세요."
        />
        <View style={styles.separator} />
        <RewardRow
          icon="🔒"
          title={`Lv.${level + 2} 이후 보상`}
          description="레벨을 올리며 새로운 보상을 만나보세요."
        />
      </View>

      <Text style={styles.sectionTitle}>경험치 모으기</Text>

      <TouchableOpacity
        style={styles.questCard}
        onPress={() => router.push('/reward/quest')}
      >
        <View style={styles.questIcon}>
          <Text style={styles.questEmoji}>🎯</Text>
        </View>
        <View style={styles.questInfo}>
          <Text style={styles.questTitle}>
            오늘의 독서 퀘스트
          </Text>
          <Text style={styles.questDescription}>
            독서 목표를 달성하고 XP와 재화를 모아보세요.
          </Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>🌱 독서 성장 안내</Text>
        <Text style={styles.tipDescription}>
          꾸준한 독서 활동으로 경험치를 쌓고
          나만의 서재를 꾸며보세요.
        </Text>
      </View>
    </ScrollView>
  );
}

interface RewardRowProps {
  icon: string;
  title: string;
  description: string;
  completed?: boolean;
}

function RewardRow({
  icon,
  title,
  description,
  completed = false,
}: RewardRowProps) {
  return (
    <View style={styles.rewardRow}>
      <View
        style={[
          styles.rewardIcon,
          completed && styles.completedIcon,
        ]}
      >
        <Text style={styles.rewardEmoji}>{icon}</Text>
      </View>

      <View style={styles.rewardInfo}>
        <Text style={styles.rewardTitle}>{title}</Text>
        <Text style={styles.rewardDescription}>
          {description}
        </Text>
      </View>

      {completed && (
        <Text style={styles.completedText}>달성</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F3',
  },
  content: {
    padding: 22,
    paddingBottom: 60,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF8F3',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  back: {
    fontSize: 32,
    color: '#263D2C',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#202820',
  },
  demoNotice: {
    fontSize: 12,
    color: '#8A7351',
    marginBottom: 12,
  },
  levelCard: {
    backgroundColor: '#E9EEE5',
    borderRadius: 22,
    padding: 24,
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 13,
    color: '#617462',
    marginBottom: 20,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  levelBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#5E7D61',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  levelNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  levelInfo: {
    flex: 1,
    marginLeft: 18,
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#334F38',
  },
  levelSubtitle: {
    fontSize: 13,
    color: '#6E7A6C',
    lineHeight: 20,
    marginTop: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 13,
    color: '#536753',
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#405B45',
  },
  progressTrack: {
    height: 10,
    borderRadius: 6,
    backgroundColor: '#D2D9CF',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#5E7D61',
  },
  remaining: {
    marginTop: 12,
    fontSize: 12,
    textAlign: 'right',
    color: '#617462',
  },
  currencyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  muted: {
    fontSize: 13,
    color: '#888888',
    marginTop: 8,
  },
  currencyValue: {
    fontSize: 25,
    fontWeight: '800',
    marginTop: 8,
    color: '#263D2C',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#CFD8CB',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  outlineButtonText: {
    color: '#456849',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#222222',
    marginBottom: 14,
  },
  rewardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 18,
    marginBottom: 30,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 19,
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F0EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedIcon: {
    backgroundColor: '#E3EDE1',
  },
  rewardEmoji: {
    fontSize: 21,
    color: '#4F7658',
  },
  rewardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  rewardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333333',
  },
  rewardDescription: {
    fontSize: 12,
    color: '#888888',
    marginTop: 5,
    lineHeight: 18,
  },
  completedText: {
    fontSize: 12,
    color: '#5E7D61',
    fontWeight: '800',
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F1ED',
  },
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 20,
    marginBottom: 18,
  },
  questIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E9EEE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questEmoji: {
    fontSize: 26,
  },
  questInfo: {
    flex: 1,
    marginLeft: 14,
  },
  questTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#303A30',
  },
  questDescription: {
    fontSize: 12,
    color: '#888888',
    lineHeight: 18,
    marginTop: 5,
  },
  arrow: {
    fontSize: 27,
    color: '#5E7D61',
    marginLeft: 8,
  },
  tipCard: {
    backgroundColor: '#F0EBDD',
    borderRadius: 18,
    padding: 20,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5A684F',
  },
  tipDescription: {
    fontSize: 12,
    color: '#777777',
    marginTop: 8,
    lineHeight: 20,
  },
});
