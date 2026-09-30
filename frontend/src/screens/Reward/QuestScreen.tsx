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

  // 백엔드에서 퀘스트 종류를 보내줄 경우 사용
  type?: 'DDAY' | 'EXP';
}

const QuestScreen = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadQuests = async () => {
    try {
      setIsLoading(true);

      const data = await getQuests();

      setQuests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('퀘스트 조회 실패:', error);

      // 백엔드 연결 전 화면 확인용 임시 데이터
      setQuests([
        {
          id: 1,
          title: '오늘 30분 독서하기',
          description: '오늘의 독서 시간을 채워보세요.',
          progress: 20,
          target: 30,
          rewardXp: 50,
          rewardCurrency: 20,
          completed: false,
          type: 'DDAY',
        },
        {
          id: 2,
          title: '오늘의 독서 완료하기',
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
          title: '독서 기록 5회 작성',
          description: '꾸준히 독서 기록을 작성해 보세요.',
          progress: 3,
          target: 5,
          rewardXp: 100,
          rewardCurrency: 50,
          completed: false,
          type: 'EXP',
        },
        {
          id: 4,
          title: '문장 10개 저장',
          description: '마음에 드는 문장을 저장해 보세요.',
          progress: 6,
          target: 10,
          rewardXp: 120,
          rewardCurrency: 60,
          completed: false,
          type: 'EXP',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuests();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          퀘스트를 불러오는 중...
        </Text>
      </View>
    );
  }

  const dDayQuests = quests.filter(
    quest => quest.type === 'DDAY'
  );

  const expQuests = quests.filter(
    quest => quest.type !== 'DDAY'
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* 상단 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          퀘스트
        </Text>

        <TouchableOpacity
          onPress={() => router.push('/shop')}
        >
          <Text style={styles.currency}>
            🪙 상점
          </Text>
        </TouchableOpacity>
      </View>

      {/* 안내 */}
      <View style={styles.heroCard}>
        <Text style={styles.heroEmoji}>🐱</Text>

        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>
            책다듬이와 함께 성장해요!
          </Text>

          <Text style={styles.heroDescription}>
            퀘스트를 완료하고 XP와 재화를 획득해 보세요.
          </Text>
        </View>
      </View>

      {/* D-day 퀘스트 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          D-day 퀘스트
        </Text>

        <Text style={styles.sectionDescription}>
          매일 도전해 보세요
        </Text>
      </View>

      {dDayQuests.length > 0 ? (
        dDayQuests.map(quest => (
          <QuestCard
            key={quest.id}
            quest={quest}
          />
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            진행 중인 D-day 퀘스트가 없습니다.
          </Text>
        </View>
      )}

      {/* EXP 퀘스트 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          EXP 퀘스트
        </Text>

        <Text style={styles.sectionDescription}>
          꾸준히 달성해 보세요
        </Text>
      </View>

      {expQuests.length > 0 ? (
        expQuests.map(quest => (
          <QuestCard
            key={quest.id}
            quest={quest}
          />
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            진행 중인 EXP 퀘스트가 없습니다.
          </Text>
        </View>
      )}

      {/* 레벨 이동 */}
      <TouchableOpacity
        style={styles.levelButton}
        onPress={() => router.push('/reward')}
      >
        <View>
          <Text style={styles.levelButtonTitle}>
            나의 성장 확인하기
          </Text>

          <Text style={styles.levelButtonDescription}>
            현재 레벨과 경험치를 확인해 보세요.
          </Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const QuestCard = ({
  quest,
}: {
  quest: Quest;
}) => {
  const progressRate =
    quest.target > 0
      ? Math.min(quest.progress / quest.target, 1)
      : 0;

  const completed =
    quest.completed ||
    quest.progress >= quest.target;

  return (
    <View style={styles.questCard}>
      <View style={styles.questTop}>
        <View
          style={[
            styles.questIcon,
            completed && styles.completedIcon,
          ]}
        >
          <Text style={styles.questIconText}>
            {completed ? '✓' : '📖'}
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

        {completed && (
          <Text style={styles.completeText}>
            완료
          </Text>
        )}
      </View>

      <View style={styles.progressTextRow}>
        <Text style={styles.progressText}>
          진행도
        </Text>

        <Text style={styles.progressValue}>
          {quest.progress} / {quest.target}
        </Text>
      </View>

      <View style={styles.progressBackground}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${progressRate * 100}%`,
            },
          ]}
        />
      </View>

      <View style={styles.rewardRow}>
        <Text style={styles.rewardLabel}>
          보상
        </Text>

        <View style={styles.rewardValues}>
          {quest.rewardXp !== undefined && (
            <Text style={styles.rewardText}>
              ⭐ +{quest.rewardXp} XP
            </Text>
          )}

          {quest.rewardCurrency !== undefined && (
            <Text style={styles.rewardText}>
              🪙 +{quest.rewardCurrency}
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

  currency: {
    fontSize: 13,
    fontWeight: 'bold',
  },

  heroCard: {
    backgroundColor: '#f1e8d8',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },

  heroEmoji: {
    fontSize: 42,
  },

  heroContent: {
    flex: 1,
    marginLeft: 14,
  },

  heroTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  heroDescription: {
    fontSize: 12,
    marginTop: 5,
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
  },

  sectionDescription: {
    fontSize: 12,
    marginTop: 3,
  },

  questCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 13,
  },

  questTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  questIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f1eee7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  completedIcon: {
    backgroundColor: '#e1eee3',
  },

  questIconText: {
    fontSize: 20,
  },

  questInfo: {
    flex: 1,
    marginLeft: 12,
  },

  questTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  questDescription: {
    fontSize: 12,
    marginTop: 4,
  },

  completeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 7,
  },

  progressText: {
    fontSize: 12,
  },

  progressValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  progressBackground: {
    height: 8,
    backgroundColor: '#eeeeee',
    borderRadius: 4,
    overflow: 'hidden',
  },

  progressBar: {
    height: '100%',
    backgroundColor: '#52765a',
    borderRadius: 4,
  },

  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  rewardLabel: {
    fontSize: 12,
  },

  rewardValues: {
    flexDirection: 'row',
    gap: 12,
  },

  rewardText: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  emptyCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },

  emptyText: {
    textAlign: 'center',
    fontSize: 13,
  },

  levelButton: {
    backgroundColor: '#e7eee5',
    borderRadius: 16,
    padding: 18,
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  levelButtonTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  levelButtonDescription: {
    fontSize: 12,
    marginTop: 4,
  },

  arrow: {
    marginLeft: 'auto',
    fontSize: 25,
  },
});
