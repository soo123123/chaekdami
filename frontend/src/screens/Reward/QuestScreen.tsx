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

const QuestScreen = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 퀘스트 목록 불러오기
  useEffect(() => {
    const loadQuests = async () => {
      try {
        const data = await getQuests();

        setQuests(data);
      } catch (error) {
        console.error(
          '퀘스트 조회 실패:',
          error
        );

        // 백엔드 연결 전 테스트용 데이터
        setQuests([
          {
            id: 1,
            title: '오늘 30분 독서하기',
            description:
              '오늘 하루 30분 이상 책을 읽어보세요.',
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
            description:
              '독서를 완료하고 기록을 남겨보세요.',
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
            description:
              '총 독서 시간을 300분까지 채워보세요.',
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
            description:
              '책을 총 5권 완독해보세요.',
            progress: 3,
            target: 5,
            rewardXp: 150,
            rewardCurrency: 100,
            completed: false,
            type: 'EXP',
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

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

  const dailyQuests =
    quests.filter(
      quest => quest.type === 'DDAY'
    );

  const achievementQuests =
    quests.filter(
      quest => quest.type === 'EXP'
    );

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
          <Text style={styles.backButton}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          퀘스트
        </Text>

        <View style={styles.headerSpace} />
      </View>

      {/* 안내 */}
      <View style={styles.guideCard}>
        <Text style={styles.guideEmoji}>
          🎯
        </Text>

        <View style={styles.guideContent}>
          <Text style={styles.guideTitle}>
            독서 퀘스트
          </Text>

          <Text style={styles.guideDescription}>
            퀘스트를 완료하고 XP와 재화를
            획득해 보세요.
          </Text>
        </View>
      </View>

      {/* 일일 퀘스트 */}
      <Text style={styles.sectionTitle}>
        오늘의 퀘스트
      </Text>

      {dailyQuests.length > 0 ? (
        dailyQuests.map(quest => (
          <QuestCard
            key={quest.id}
            quest={quest}
          />
        ))
      ) : (
        <Text style={styles.emptyText}>
          오늘의 퀘스트가 없습니다.
        </Text>
      )}

      {/* 누적 퀘스트 */}
      <Text style={styles.sectionTitle}>
        누적 퀘스트
      </Text>

      {achievementQuests.length > 0 ? (
        achievementQuests.map(quest => (
          <QuestCard
            key={quest.id}
            quest={quest}
          />
        ))
      ) : (
        <Text style={styles.emptyText}>
          누적 퀘스트가 없습니다.
        </Text>
      )}

      {/* 레벨 이동 */}
      <TouchableOpacity
        style={styles.rewardButton}
        onPress={() =>
          router.push('/reward')
        }
      >
        <Text style={styles.rewardButtonText}>
          나의 레벨 확인하기
        </Text>
      </TouchableOpacity>

      {/* 상점 이동 */}
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() =>
          router.push('/shop')
        }
      >
        <Text style={styles.shopButtonText}>
          상점으로 이동
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

interface QuestCardProps {
  quest: Quest;
}

const QuestCard = ({
  quest,
}: QuestCardProps) => {
  const progress =
    quest.target > 0
      ? Math.min(
          quest.progress / quest.target,
          1
        )
      : 0;

  return (
    <View style={styles.questCard}>
      <View style={styles.questTop}>
        <View style={styles.questTextArea}>
          <Text style={styles.questTitle}>
            {quest.completed
              ? '✅ '
              : '📖 '}
            {quest.title}
          </Text>

          {quest.description && (
            <Text
              style={styles.questDescription}
            >
              {quest.description}
            </Text>
          )}
        </View>

        {quest.completed && (
          <Text style={styles.completeText}>
            완료
          </Text>
        )}
      </View>

      {/* 진행도 */}
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>
          진행도
        </Text>

        <Text style={styles.progressValue}>
          {quest.progress} / {quest.target}
        </Text>
      </View>

      <View
        style={styles.progressBackground}
      >
        <View
          style={[
            styles.progressBar,
            {
              width: `${progress * 100}%`,
            },
          ]}
        />
      </View>

      {/* 보상 */}
      <View style={styles.rewardRow}>
        <Text style={styles.rewardLabel}>
          보상
        </Text>

        <View style={styles.rewardValues}>
          {quest.rewardXp !== undefined && (
            <Text style={styles.rewardValue}>
              ⭐ {quest.rewardXp} XP
            </Text>
          )}

          {quest.rewardCurrency !==
            undefined && (
            <Text style={styles.rewardValue}>
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
    backgroundColor: '#faf8f3',
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#faf8f3',
  },

  loadingText: {
    marginTop: 10,
    color: '#777777',
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

  guideCard: {
    backgroundColor: '#e9eee5',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },

  guideEmoji: {
    fontSize: 35,
  },

  guideContent: {
    flex: 1,
    marginLeft: 14,
  },

  guideTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },

  guideDescription: {
    fontSize: 12,
    color: '#777777',
    marginTop: 5,
    lineHeight: 18,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 5,
  },

  questCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },

  questTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  questTextArea: {
    flex: 1,
  },

  questTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  questDescription: {
    fontSize: 11,
    color: '#777777',
    marginTop: 5,
    lineHeight: 17,
  },

  completeText: {
    color: '#4f7658',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 10,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 7,
  },

  progressLabel: {
    fontSize: 11,
    color: '#777777',
  },

  progressValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },

  progressBackground: {
    height: 9,
    backgroundColor: '#eeeeee',
    borderRadius: 5,
    overflow: 'hidden',
  },

  progressBar: {
    height: '100%',
    backgroundColor: '#4f7658',
    borderRadius: 5,
  },

  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },

  rewardLabel: {
    fontSize: 11,
    color: '#777777',
  },

  rewardValues: {
    flexDirection: 'row',
  },

  rewardValue: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 12,
  },

  emptyText: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 18,
    color: '#777777',
    marginBottom: 20,
  },

  rewardButton: {
    backgroundColor: '#4f7658',
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 15,
  },

  rewardButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },

  shopButton: {
    borderWidth: 1,
    borderColor: '#4f7658',
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },

  shopButtonText: {
    color: '#4f7658',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
