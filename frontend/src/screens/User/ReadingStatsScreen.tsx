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

import {
  getReadingStats,
  ReadingStats,
  ReadingStatItem,
} from '../../api/readingStatsApi';

type Period = 'week' | 'month';

const ReadingStatsScreen = () => {
  const [period, setPeriod] =
    useState<Period>('week');

  const [stats, setStats] =
    useState<ReadingStats | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data =
          await getReadingStats();

        setStats(data);
      } catch (error) {
        console.error(
          '독서 통계 조회 실패:',
          error
        );

        // 백엔드 연결 전 테스트용 데이터
        setStats({
          totalMinutes: 250,
          averageMinutes: 36,

          completedBooks: 3,
          totalPages: 245,
          readingDays: 5,

          goalBooks: 3,
          goalTarget: 5,

          weekly: [
            {
              label: '월',
              minutes: 20,
            },
            {
              label: '화',
              minutes: 35,
            },
            {
              label: '수',
              minutes: 15,
            },
            {
              label: '목',
              minutes: 50,
            },
            {
              label: '금',
              minutes: 30,
            },
            {
              label: '토',
              minutes: 60,
            },
            {
              label: '일',
              minutes: 40,
            },
          ],

          monthly: [
            {
              label: '1주',
              minutes: 180,
            },
            {
              label: '2주',
              minutes: 240,
            },
            {
              label: '3주',
              minutes: 150,
            },
            {
              label: '4주',
              minutes: 300,
            },
          ],
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  if (isLoading || !stats) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          독서 통계를 불러오는 중...
        </Text>
      </View>
    );
  }

  const chartData =
    period === 'week'
      ? stats.weekly
      : stats.monthly;

  const maxMinutes = Math.max(
    ...chartData.map(
      item => item.minutes
    ),
    1
  );

  const goalProgress =
    stats.goalTarget > 0
      ? Math.min(
          stats.goalBooks /
            stats.goalTarget,
          1
        )
      : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
    >
      {/* 상단 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            router.back()
          }
        >
          <Text style={styles.backButton}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          독서 통계
        </Text>

        <View
          style={styles.headerSpace}
        />
      </View>

      {/* 주간 / 월간 선택 */}
      <View style={styles.periodContainer}>
        <TouchableOpacity
          style={[
            styles.periodButton,
            period === 'week' &&
              styles.periodButtonActive,
          ]}
          onPress={() =>
            setPeriod('week')
          }
        >
          <Text
            style={[
              styles.periodText,
              period === 'week' &&
                styles.periodTextActive,
            ]}
          >
            주간
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.periodButton,
            period === 'month' &&
              styles.periodButtonActive,
          ]}
          onPress={() =>
            setPeriod('month')
          }
        >
          <Text
            style={[
              styles.periodText,
              period === 'month' &&
                styles.periodTextActive,
            ]}
          >
            월간
          </Text>
        </TouchableOpacity>
      </View>

      {/* 요약 */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {stats.totalMinutes}
          </Text>

          <Text style={styles.summaryLabel}>
            총 독서 시간(분)
          </Text>
        </View>

        <View style={styles.verticalLine} />

        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {stats.averageMinutes}
          </Text>

          <Text style={styles.summaryLabel}>
            평균 독서 시간(분)
          </Text>
        </View>
      </View>

      {/* 독서 시간 그래프 */}
      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>
          {period === 'week'
            ? '이번 주 독서 시간'
            : '이번 달 독서 시간'}
        </Text>

        <View style={styles.chart}>
          {chartData.map(
            (
              item: ReadingStatItem,
              index
            ) => {
              const height =
                (item.minutes /
                  maxMinutes) *
                130;

              return (
                <View
                  key={`${item.label}-${index}`}
                  style={styles.barItem}
                >
                  <Text
                    style={styles.barValue}
                  >
                    {item.minutes}
                  </Text>

                  <View
                    style={[
                      styles.bar,
                      {
                        height,
                      },
                    ]}
                  />

                  <Text
                    style={styles.barLabel}
                  >
                    {item.label}
                  </Text>
                </View>
              );
            }
          )}
        </View>
      </View>

      {/* 독서 기록 */}
      <Text style={styles.sectionTitle}>
        나의 독서 기록
      </Text>

      <View style={styles.recordContainer}>
        <View style={styles.recordCard}>
          <Text style={styles.recordEmoji}>
            📚
          </Text>

          <Text style={styles.recordValue}>
            {stats.completedBooks}권
          </Text>

          <Text style={styles.recordLabel}>
            완독한 책
          </Text>
        </View>

        <View style={styles.recordCard}>
          <Text style={styles.recordEmoji}>
            📖
          </Text>

          <Text style={styles.recordValue}>
            {stats.totalPages}쪽
          </Text>

          <Text style={styles.recordLabel}>
            읽은 페이지
          </Text>
        </View>

        <View style={styles.recordCard}>
          <Text style={styles.recordEmoji}>
            📅
          </Text>

          <Text style={styles.recordValue}>
            {stats.readingDays}일
          </Text>

          <Text style={styles.recordLabel}>
            독서한 날
          </Text>
        </View>
      </View>

      {/* 독서 목표 */}
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View>
            <Text style={styles.goalTitle}>
              이번 달 독서 목표
            </Text>

            <Text
              style={styles.goalDescription}
            >
              목표까지 조금만 더 힘내세요!
            </Text>
          </View>

          <Text style={styles.goalValue}>
            {stats.goalBooks} /{' '}
            {stats.goalTarget}권
          </Text>
        </View>

        <View
          style={styles.progressBackground}
        >
          <View
            style={[
              styles.progressBar,
              {
                width: `${
                  goalProgress * 100
                }%`,
              },
            ]}
          />
        </View>

        <Text style={styles.progressText}>
          {Math.round(
            goalProgress * 100
          )}
          % 달성
        </Text>
      </View>

      {/* 마이페이지 */}
      <TouchableOpacity
        style={styles.myPageButton}
        onPress={() =>
          router.push('/mypage')
        }
      >
        <Text
          style={styles.myPageButtonText}
        >
          마이페이지로 돌아가기
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ReadingStatsScreen;

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

  periodContainer: {
    backgroundColor: '#eeeeee',
    borderRadius: 15,
    padding: 4,
    flexDirection: 'row',
    marginBottom: 18,
  },

  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },

  periodButtonActive: {
    backgroundColor: '#4f7658',
  },

  periodText: {
    color: '#777777',
    fontSize: 13,
  },

  periodTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },

  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    marginBottom: 18,
  },

  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },

  summaryValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#3f6548',
  },

  summaryLabel: {
    fontSize: 11,
    color: '#777777',
    marginTop: 5,
  },

  verticalLine: {
    width: 1,
    backgroundColor: '#eeeeee',
  },

  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 25,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  chart: {
    height: 190,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },

  barItem: {
    flex: 1,
    alignItems: 'center',
  },

  barValue: {
    fontSize: 10,
    marginBottom: 5,
    color: '#777777',
  },

  bar: {
    width: 20,
    minHeight: 4,
    backgroundColor: '#4f7658',
    borderRadius: 5,
  },

  barLabel: {
    fontSize: 10,
    color: '#777777',
    marginTop: 7,
  },

  recordContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },

  recordCard: {
    width: '31%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
  },

  recordEmoji: {
    fontSize: 23,
  },

  recordValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 7,
  },

  recordLabel: {
    fontSize: 10,
    color: '#777777',
    marginTop: 4,
  },

  goalCard: {
    backgroundColor: '#e9eee5',
    borderRadius: 18,
    padding: 18,
  },

  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  goalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  goalDescription: {
    fontSize: 10,
    color: '#777777',
    marginTop: 4,
  },

  goalValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  progressBackground: {
    height: 10,
    backgroundColor: '#ffffff',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 18,
  },

  progressBar: {
    height: '100%',
    backgroundColor: '#4f7658',
    borderRadius: 5,
  },

  progressText: {
    textAlign: 'right',
    fontSize: 11,
    color: '#4f7658',
    marginTop: 7,
    fontWeight: 'bold',
  },

  myPageButton: {
    borderWidth: 1,
    borderColor: '#4f7658',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },

  myPageButtonText: {
    color: '#4f7658',
    fontWeight: 'bold',
  },
});
