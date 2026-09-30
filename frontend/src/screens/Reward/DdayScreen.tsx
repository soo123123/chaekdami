import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { router } from 'expo-router';

interface DdayGoal {
  id: number;
  title: string;
  targetDate: string;
  remainingDays: number;
}

const DdayScreen = () => {
  // 백엔드 연결 전 테스트용 데이터
  const [goals] = useState<DdayGoal[]>([
    {
      id: 1,
      title: '현재 읽는 책 완독하기',
      targetDate: '2026.10.10',
      remainingDays: 10,
    },
    {
      id: 2,
      title: '이번 달 독서 목표 달성',
      targetDate: '2026.10.31',
      remainingDays: 31,
    },
  ]);

  const handleAddGoal = () => {
    Alert.alert(
      'D-day 추가',
      'D-day 등록 기능은 백엔드 연결 후 구현할 예정입니다.'
    );
  };

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
          D-day
        </Text>

        <View style={styles.headerSpace} />
      </View>

      {/* 대표 D-day */}
      <View style={styles.mainCard}>
        <Text style={styles.mainLabel}>
          가장 가까운 독서 목표
        </Text>

        <Text style={styles.mainDday}>
          D-{goals[0].remainingDays}
        </Text>

        <Text style={styles.mainTitle}>
          {goals[0].title}
        </Text>

        <Text style={styles.mainDate}>
          목표일 {goals[0].targetDate}
        </Text>
      </View>

      {/* 목표 목록 제목 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          나의 독서 목표
        </Text>

        <TouchableOpacity
          style={styles.addSmallButton}
          onPress={handleAddGoal}
        >
          <Text style={styles.addSmallButtonText}>
            + 추가
          </Text>
        </TouchableOpacity>
      </View>

      {/* D-day 목록 */}
      {goals.map(goal => (
        <View
          key={goal.id}
          style={styles.goalCard}
        >
          <View style={styles.ddayCircle}>
            <Text style={styles.ddayText}>
              D-{goal.remainingDays}
            </Text>
          </View>

          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>
              {goal.title}
            </Text>

            <Text style={styles.goalDate}>
              {goal.targetDate}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'D-day',
                '수정 및 삭제 기능은 추후 연결할 예정입니다.'
              )
            }
          >
            <Text style={styles.moreButton}>
              ⋮
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* 목표 안내 */}
      <View style={styles.guideCard}>
        <Text style={styles.guideEmoji}>
          📚
        </Text>

        <View style={styles.guideContent}>
          <Text style={styles.guideTitle}>
            독서 목표를 만들어보세요
          </Text>

          <Text style={styles.guideDescription}>
            완독 목표 날짜를 설정하고 꾸준히 독서해보세요.
          </Text>
        </View>
      </View>

      {/* 추가 버튼 */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddGoal}
      >
        <Text style={styles.addButtonText}>
          + 새로운 D-day 만들기
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default DdayScreen;

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

  mainCard: {
    backgroundColor: '#e9eee5',
    borderRadius: 22,
    padding: 25,
    alignItems: 'center',
    marginBottom: 30,
  },

  mainLabel: {
    fontSize: 12,
    color: '#647268',
  },

  mainDday: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#3f6548',
    marginTop: 10,
  },

  mainTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 10,
  },

  mainDate: {
    fontSize: 11,
    color: '#777777',
    marginTop: 6,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  addSmallButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  addSmallButtonText: {
    color: '#4f7658',
    fontSize: 13,
    fontWeight: 'bold',
  },

  goalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 17,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  ddayCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#edf2e9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  ddayText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3f6548',
  },

  goalInfo: {
    flex: 1,
    marginLeft: 14,
  },

  goalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  goalDate: {
    fontSize: 11,
    color: '#888888',
    marginTop: 5,
  },

  moreButton: {
    fontSize: 24,
    paddingHorizontal: 8,
  },

  guideCard: {
    backgroundColor: '#f2eee6',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },

  guideEmoji: {
    fontSize: 30,
  },

  guideContent: {
    flex: 1,
    marginLeft: 14,
  },

  guideTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  guideDescription: {
    fontSize: 11,
    color: '#777777',
    marginTop: 5,
    lineHeight: 17,
  },

  addButton: {
    backgroundColor: '#4f7658',
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },

  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
