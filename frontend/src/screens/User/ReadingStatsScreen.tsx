import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import { router } from 'expo-router';

type Period = 'week' | 'month';

const ReadingStatsScreen = () => {
  const [period, setPeriod] = useState<Period>('week');

  // 임시 통계 데이터
  // 나중에 백엔드 API 데이터로 변경
  const weeklyData = [
    { day: '월', minutes: 20 },
    { day: '화', minutes: 35 },
    { day: '수', minutes: 15 },
    { day: '목', minutes: 50 },
    { day: '금', minutes: 30 },
    { day: '토', minutes: 60 },
    { day: '일', minutes: 40 },
  ];

  const monthlyData = [
    { day: '1주', minutes: 180 },
    { day: '2주', minutes: 240 },
    { day: '3주', minutes: 150 },
    { day: '4주', minutes: 300 },
  ];

  const data =
    period === 'week'
      ? weeklyData
      : monthlyData;

  const totalMinutes = data.reduce(
    (sum, item) => sum + item.minutes,
    0
  );

  const averageMinutes = Math.round(
    totalMinutes / data.length
  );

  const maxMinutes = Math.max(
    ...data.map(item => item.minutes),
    1
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
          독서 통계
        </Text>

        <View style={styles.headerSpace} />
      </View>

      {/* 기간 선택 */}
      <View style={styles.periodContainer}>
        <TouchableOpacity
          style={[
            styles.periodButton,
            period === 'week' &&
              styles.selectedPeriodButton,
          ]}
          onPress={() => setPeriod('week')}
        >
          <Text
            style={[
              styles.periodText,
              period === 'week' &&
                styles.selectedPeriodText,
            ]}
          >
            주간
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.periodButton,
            period === 'month' &&
              styles.selectedPeriodButton,
          ]}
          onPress={() => setPeriod('month')}
        >
          <Text
            style={[
              styles.periodText,
              period === 'month' &&
                styles.selectedPeriodText,
            ]}
          >
            월간
          </Text>
        </TouchableOpacity>
      </View>

      {/* 요약 */}
      <Text style={styles.sectionTitle}>
        독서 요약
      </Text>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryEmoji}>
            ⏱️
          </Text>

          <Text style={styles.summaryValue}>
            {totalMinutes}분
          </Text>

          <Text style={styles.summaryLabel}>
            총 독서 시간
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryEmoji}>
            📖
          </Text>

          <Text style={styles.summaryValue}>
            {averageMinutes}분
          </Text>

          <Text style={styles.summaryLabel}>
            평균 독서 시간
          </Text>
        </View>
      </View>

      {/* 독서 시간 그래프 */}
      <Text style={styles.sectionTitle}>
        독서 시간
      </Text>

      <View style={styles.chartCard}>
        <View style={styles.chart}>
          {data.map((item, index) => {
            const barHeight =
              (item.minutes / maxMinutes) * 140;

            return (
              <View
                key={index}
                style={styles.barItem}
              >
                <Text style={styles.barValue}>
                  {item.minutes}
                </Text>

                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                    },
                  ]}
                />

                <Text style={styles.barLabel}>
                  {item.day}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.chartUnit}>
          단위: 분
        </Text>
      </View>

      {/* 이번 기간 기록 */}
      <Text style={styles.sectionTitle}>
        {period === 'week'
          ? '이번 주 기록'
          : '이번 달 기록'}
      </Text>

      <View style={styles.recordCard}>
        <View style={styles.recordRow}>
          <View>
            <Text style={styles.recordLabel}>
              📚 읽은 책
            </Text>

            <Text
              style={styles.recordDescription}
            >
              독서한 도서 수
            </Text>
          </View>

          <Text style={styles.recordValue}>
            3권
          </Text>
        </View>

        <View style={styles.line} />

        <View style={styles.recordRow}>
          <View>
            <Text style={styles.recordLabel}>
              📄 읽은 페이지
            </Text>

            <Text
              style={styles.recordDescription}
            >
              읽은 페이지 합계
            </Text>
          </View>

          <Text style={styles.recordValue}>
            245쪽
          </Text>
        </View>

        <View style={styles.line} />

        <View style={styles.recordRow}>
          <View>
            <Text style={styles.recordLabel}>
              🔥 연속 독서
            </Text>

            <Text
              style={styles.recordDescription}
            >
              현재 연속 독서 일수
            </Text>
          </View>

          <Text style={styles.recordValue}>
            5일
          </Text>
        </View>
      </View>

      {/* 목표 */}
      <Text style={styles.sectionTitle}>
        독서 목표
      </Text>

      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View>
            <Text style={styles.goalTitle}>
              이번 달 독서 목표
            </Text>

            <Text style={styles.goalDescription}>
              목표까지 조금만 더 힘내세요!
            </Text>
          </View>

          <Text style={styles.goalValue}>
            3 / 5권
          </Text>
        </View>

        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressBar,
              {
                width: '60%',
              },
            ]}
          />
        </View>

        <Text style={styles.progressText}>
          60% 달성
        </Text>
      </View>

      {/* 마이페이지 */}
      <TouchableOpacity
        style={styles.myPageButton}
        onPress={() => router.push('/mypage')}
      >
        <Text style={styles.myPageButtonText}>
          마이페이지로 이동
        </Text>

        <Text style={styles.arrow}>
          ›
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
    backgroundColor: '#ece9e2',
    borderRadius: 22,
    padding: 4,
    flexDirection: 'row',
    marginBottom: 25,
  },

  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 18,
  },

  selectedPeriodButton: {
    backgroundColor: '#ffffff',
  },

  periodText: {
    fontSize: 13,
    color: '#777777',
  },

  selectedPeriodText: {
    color: '#3f6548',
    fontWeight: 'bold',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },

  summaryCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 17,
    paddingVertical: 20,
    alignItems: 'center',
  },

  summaryEmoji: {
    fontSize: 25,
  },

  summaryValue: {
    fontSize: 19,
    fontWeight: 'bold',
    marginTop: 7,
  },

  summaryLabel: {
    fontSize: 11,
    color: '#777777',
    marginTop: 4,
  },

  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 28,
  },

  chart: {
    height: 190,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },

  barItem: {
    flex: 1,
    height: 180,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  barValue: {
    fontSize: 9,
    marginBottom: 5,
  },

  bar: {
    width: 20,
    minHeight: 4,
    backgroundColor: '#66866d',
    borderRadius: 5,
  },

  barLabel: {
    fontSize: 10,
    marginTop: 7,
  },

  chartUnit: {
    textAlign: 'right',
    fontSize: 10,
    color: '#999999',
    marginTop: 8,
  },

  recordCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 28,
  },

  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  recordLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  recordDescription: {
    fontSize: 10,
    color: '#888888',
    marginTop: 3,
  },

  recordValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4f7658',
  },

  line: {
    height: 1,
    backgroundColor: '#eeeeee',
    marginVertical: 15,
  },

  goalCard: {
    backgroundColor: '#e9eee5',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
  },

  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3f6548',
  },

  progressBackground: {
    height: 9,
    backgroundColor: '#d8ded5',
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 18,
  },

  progressBar: {
    height: '100%',
    backgroundColor: '#4f7658',
    borderRadius: 6,
  },

  progressText: {
    fontSize: 10,
    textAlign: 'right',
    marginTop: 6,
  },

  myPageButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
  },

  myPageButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
  },

  arrow: {
    fontSize: 24,
    color: '#777777',
  },
});
