
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
import { getQuests } from '../../api/rewardApi';

interface Quest {
  id: number;
  title: string;
  description?: string;
  progress: number;
  target: number;
  rewardXp?: number;
  rewardCurrency?: number;
  completed?: boolean;
  type?: 'DDAY' | 'EXP';
}

const testQuests: Quest[] = [
  {
    id: 1,
    title: '오늘 30분 독서하기',
    description: '오늘 하루 30분 이상 책을 읽어보세요.',
    progress: 20,
    target: 30,
    rewardXp: 50,
    rewardCurrency: 20,
    completed: false,
    type: 'DDAY',
  },
  {
    id: 2,
    title: '오늘 독서 기록 남기기',
    description: '독서를 완료하고 기록을 남겨보세요.',
    progress: 1,
    target: 1,
    rewardXp: 30,
    rewardCurrency: 10,
    completed: true,
    type: 'DDAY',
  },
  {
    id: 3,
    title: '누적 300분 독서하기',
    description: '총 독서 시간을 300분까지 채워보세요.',
    progress: 180,
    target: 300,
    rewardXp: 100,
    rewardCurrency: 50,
    completed: false,
    type: 'EXP',
  },
  {
    id: 4,
    title: '책 5권 완독하기',
    description: '책을 총 5권 완독해보세요.',
    progress: 3,
    target: 5,
    rewardXp: 150,
    rewardCurrency: 100,
    completed: false,
    type: 'EXP',
  },
];

const QuestScreen = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestData, setIsTestData] = useState(false);

  useEffect(() => {
    const loadQuests = async () => {
      try {
        const data = await getQuests();

        if (!Array.isArray(data)) {
          throw new Error('퀘스트 응답 형식이 올바르지 않습니다.');
        }

        setQuests(data);
        setIsTestData(false);
      } catch (error) {
        console.warn('퀘스트 조회 실패:', error);
        setQuests(testQuests);
        setIsTestData(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuests();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5E7D61" />
        <Text style={styles.loadingText}>
          퀘스트를 불러오는 중...
        </Text>
      </View>
    );
  }

  const dailyQuests = quests.filter(
    quest => quest.type === 'DDAY'
  );

  const achievementQuests = quests.filter(
    quest => quest.type === 'EXP'
  );

  const completedDaily = dailyQuests.filter(
    quest => quest.completed
  ).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backArea}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>독서 퀘스트</Text>
        <View style={styles.backArea} />
      </View>

      {isTestData && (
        <Text style={styles.testNotice}>
          현재 서버 연결 전 테스트 데이터를 표시하고 있어요.
        </Text>
      )}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryEyebrow}>
          오늘의 독서 도전
        </Text>

        <Text style={styles.summaryTitle}>
          오늘도 책과 함께 성장해요!
        </Text>

        <Text style={styles.summaryDescription}>
          작은 독서 습관을 쌓고 경험치와 재화를 모아보세요.
        </Text>

        <View style={styles.summaryProgressHeader}>
          <Text style={styles.summaryProgressLabel}>
            오늘의 퀘스트 달성
          </Text>
          <Text style={styles.summaryProgressValue}>
            {completedDaily} / {dailyQuests.length}
          </Text>
        </View>

        <ProgressBar
          progress={
            dailyQuests.length > 0
              ? completedDaily / dailyQuests.length
              : 0
          }
          color="#5E7D61"
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          오늘의 퀘스트
        </Text>
        <Text style={styles.sectionCount}>
          {completedDaily}/{dailyQuests.length} 완료
        </Text>
      </View>

      {dailyQuests.length > 0 ? (
        dailyQuests.map(quest => (
          <QuestCard key={quest.id} quest={quest} />
        ))
      ) : (
        <Text style={styles.emptyText}>
          오늘의 퀘스트가 없습니다.
        </Text>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          누적 퀘스트
        </Text>
        <Text style={styles.sectionCount}>
          {achievementQuests.length}개
        </Text>
      </View>

      {achievementQuests.length > 0 ? (
        achievementQuests.map(quest => (
          <QuestCard key={quest.id} quest={quest} />
        ))
      ) : (
        <Text style={styles.emptyText}>
          누적 퀘스트가 없습니다.
        </Text>
      )}

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>🌱 독서 성장 TIP</Text>
        <Text style={styles.tipDescription}>
          매일 꾸준히 독서하고 퀘스트를 완료하면
          레벨을 올리고 상점에서 사용할 재화를
          모을 수 있어요.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.push('/reward/reward')}
      >
        <Text style={styles.primaryButtonText}>
          나의 레벨 확인하기 ›
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push('/reward/shop')}
      >
        <Text style={styles.secondaryButtonText}>
          상점으로 이동 ›
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const ProgressBar = ({
  progress,
  color,
}: {
  progress: number;
  color: string;
}) => {
  const safeProgress = Number.isFinite(progress)
    ? Math.max(0, Math.min(progress, 1))
    : 0;

  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${safeProgress * 100}%`,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
};

const QuestCard = ({ quest }: { quest: Quest }) => {
  const current = Number(quest.progress) || 0;
  const target = Number(quest.target) || 0;

  const progress = target > 0
    ? current / target
    : 0;

  const isCompleted = Boolean(quest.completed);

  return (
    <View style={styles.questCard}>
      <View style={styles.questTop}>
        <View style={styles.questIcon}>
          <Text style={styles.questIconText}>
            {isCompleted ? '✓' : '📖'}
          </Text>
        </View>

        <View style={styles.questInfo}>
          <Text style={styles.questTitle}>
            {quest.title}
          </Text>

          {quest.description && (
            <Text style={styles.questDescription}>
              {quest.description}
            </Text>
          )}
        </View>

        {isCompleted && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>
              완료
            </Text>
          </View>
        )}
      </View>

      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>
          진행 현황
        </Text>
        <Text style={styles.progressValue}>
          {current} / {target}
        </Text>
      </View>

      <ProgressBar
        progress={progress}
        color="#688168"
      />

      <View style={styles.rewardRow}>
        <Text style={styles.rewardLabel}>
          완료 보상
        </Text>

        <View style={styles.rewardItems}>
          {quest.rewardXp !== undefined && (
            <Text style={styles.rewardText}>
              ⭐ {quest.rewardXp} XP
            </Text>
          )}

          {quest.rewardCurrency !== undefined && (
            <Text style={styles.rewardText}>
              🪙 {quest.rewardCurrency}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default QuestScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F3',
  },
  content: {
    padding: 22,
    paddingBottom: 55,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8F3',
  },
  loadingText: {
    marginTop: 12,
    color: '#777777',
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backArea: {
    width: 35,
    alignItems: 'flex-start',
  },
  backText: {
    fontSize: 32,
    color: '#303B30',
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#242B24',
  },
  testNotice: {
    fontSize: 12,
    color: '#95774F',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#EAF0E7',
    borderRadius: 24,
    padding: 24,
    marginBottom: 30,
  },
  summaryEyebrow: {
    fontSize: 12,
    color: '#637A63',
    marginBottom: 15,
  },
  summaryTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#344F38',
    marginBottom: 10,
  },
  summaryDescription: {
    fontSize: 13,
    color: '#728172',
    lineHeight: 21,
    marginBottom: 26,
  },
  summaryProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryProgressLabel: {
    fontSize: 12,
    color: '#566E57',
  },
  summaryProgressValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#405B43',
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#E7E7E7',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#242B24',
  },
  sectionCount: {
    fontSize: 12,
    color: '#718371',
    fontWeight: '700',
  },
  questCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 15,
  },
  questTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  questIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EAF0E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  questIconText: {
    fontSize: 21,
    color: '#55765B',
    fontWeight: '800',
  },
  questInfo: {
    flex: 1,
    paddingTop: 3,
  },
  questTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#303630',
  },
  questDescription: {
    fontSize: 12,
    color: '#888888',
    lineHeight: 19,
    marginTop: 6,
  },
  completedBadge: {
    backgroundColor: '#EAF0E7',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 8,
  },
  completedBadgeText: {
    fontSize: 11,
    color: '#4F7658',
    fontWeight: '800',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 9,
  },
  progressLabel: {
    fontSize: 12,
    color: '#888888',
  },
  progressValue: {
    fontSize: 12,
    color: '#4D674F',
    fontWeight: '800',
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 20,
  },
  rewardLabel: {
    fontSize: 12,
    color: '#888888',
  },
  rewardItems: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#526C55',
  },
  emptyText: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    color: '#888888',
    marginBottom: 22,
  },
  tipCard: {
    backgroundColor: '#F0EBDD',
    borderRadius: 20,
    padding: 20,
    marginTop: 15,
    marginBottom: 22,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#5A604F',
  },
  tipDescription: {
    fontSize: 12,
    lineHeight: 21,
    color: '#858174',
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: '#5E7D61',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D9E2D7',
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#55765B',
    fontSize: 14,
    fontWeight: '800',
  },
});
