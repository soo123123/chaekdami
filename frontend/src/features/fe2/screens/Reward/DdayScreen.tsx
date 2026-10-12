
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';

interface DdayGoal {
  id: number;
  title: string;
  targetDate: string;
}

const initialGoals: DdayGoal[] = [
  {
    id: 1,
    title: '현재 읽는 책 완독하기',
    targetDate: '2026-10-20',
  },
  {
    id: 2,
    title: '이번 달 독서 목표 달성',
    targetDate: '2026-10-31',
  },
];

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getRemainingDays = (targetDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = parseDate(targetDate);
  const difference = target.getTime() - today.getTime();

  return Math.round(difference / 86400000);
};

const getDdayText = (days: number) => {
  if (days === 0) return 'D-DAY';
  if (days > 0) return `D-${days}`;
  return `D+${Math.abs(days)}`;
};

export default function DdayScreen() {
  const [goals] = useState<DdayGoal[]>(initialGoals);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    const cells: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(null);
    }

    for (let day = 1; day <= lastDate; day++) {
      cells.push(day);
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [year, month]);

  const closestGoal = [...goals]
    .filter(goal => getRemainingDays(goal.targetDate) >= 0)
    .sort(
      (a, b) =>
        getRemainingDays(a.targetDate) -
        getRemainingDays(b.targetDate)
    )[0];

  const selectedGoals = goals.filter(
    goal => goal.targetDate === selectedDate
  );

  const moveMonth = (amount: number) => {
    setCurrentMonth(new Date(year, month + amount, 1));
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>D-day</Text>

          <View style={styles.headerSpace} />
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>가장 가까운 독서 목표</Text>

          <Text style={styles.summaryDday}>
            {closestGoal
              ? getDdayText(getRemainingDays(closestGoal.targetDate))
              : '목표 없음'}
          </Text>

          <Text style={styles.summaryTitle}>
            {closestGoal?.title ?? '새 독서 목표를 만들어보세요'}
          </Text>

          {closestGoal && (
            <Text style={styles.summaryDate}>
              목표일 {closestGoal.targetDate}
            </Text>
          )}
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={() => moveMonth(-1)}>
              <Text style={styles.monthArrow}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.monthTitle}>
              {year}년 {month + 1}월
            </Text>

            <TouchableOpacity onPress={() => moveMonth(1)}>
              <Text style={styles.monthArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <Text key={day} style={styles.weekText}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => {
              const date = day
                ? formatDate(new Date(year, month, day))
                : '';

              const isSelected = date === selectedDate;
              const isToday = date === formatDate(new Date());
              const hasGoal = goals.some(
                goal => goal.targetDate === date
              );

              return (
                <TouchableOpacity
                  key={`${index}-${date}`}
                  style={styles.dayCell}
                  disabled={!day}
                  onPress={() => setSelectedDate(date)}
                >
                  {day && (
                    <View
                      style={[
                        styles.dayCircle,
                        isToday && styles.todayCircle,
                        isSelected && styles.selectedCircle,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSelected && styles.selectedDayText,
                        ]}
                      >
                        {day}
                      </Text>

                      {hasGoal && (
                        <View
                          style={[
                            styles.goalDot,
                            isSelected && styles.selectedGoalDot,
                          ]}
                        />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>선택한 날짜의 목표</Text>
          <Text style={styles.selectedDate}>{selectedDate}</Text>
        </View>

        {selectedGoals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              이 날짜에 등록된 독서 목표가 없어요.
            </Text>
          </View>
        ) : (
          selectedGoals.map(goal => (
            <View key={goal.id} style={styles.goalCard}>
              <View style={styles.goalBadge}>
                <Text style={styles.goalBadgeText}>
                  {getDdayText(getRemainingDays(goal.targetDate))}
                </Text>
              </View>

              <View style={styles.goalInfo}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.goalDate}>
                  목표일 {goal.targetDate}
                </Text>
              </View>
            </View>
          ))
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>나의 독서 목표</Text>
        </View>

        {goals.map(goal => (
          <TouchableOpacity
            key={goal.id}
            style={styles.goalCard}
            onPress={() => {
              setSelectedDate(goal.targetDate);
              const target = parseDate(goal.targetDate);
              setCurrentMonth(
                new Date(target.getFullYear(), target.getMonth(), 1)
              );
            }}
          >
            <View style={styles.goalBadge}>
              <Text style={styles.goalBadgeText}>
                {getDdayText(getRemainingDays(goal.targetDate))}
              </Text>
            </View>

            <View style={styles.goalInfo}>
              <Text style={styles.goalTitle}>{goal.title}</Text>
              <Text style={styles.goalDate}>
                목표일 {goal.targetDate}
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.noticeCard}>
          <Text style={styles.noticeEmoji}>📚</Text>
          <View style={styles.noticeInfo}>
            <Text style={styles.noticeTitle}>독서 목표를 만들어보세요</Text>
            <Text style={styles.noticeDescription}>
              목표 날짜를 정하고 꾸준히 독서해보세요.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            alert('독서 목표 등록 기능은 추후 연결할 예정입니다.')
          }
        >
          <Text style={styles.addButtonText}>+ 새로운 D-day 만들기</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F0',
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  backText: {
    fontSize: 32,
    color: '#333',
  },
  headerTitle: {
    fontSize: 23,
    fontWeight: '800',
  },
  headerSpace: {
    width: 20,
  },
  summaryCard: {
    backgroundColor: '#E8EEE4',
    borderRadius: 22,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryLabel: {
    color: '#777',
    fontSize: 13,
  },
  summaryDday: {
    fontSize: 43,
    fontWeight: '800',
    color: '#49684D',
    marginTop: 15,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 8,
  },
  summaryDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 25,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthArrow: {
    fontSize: 30,
    color: '#55705A',
    paddingHorizontal: 12,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekText: {
    width: '14.2857%',
    textAlign: 'center',
    fontWeight: '600',
    color: '#777',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2857%',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 39,
    height: 39,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: {
    borderWidth: 1,
    borderColor: '#5E7D61',
  },
  selectedCircle: {
    backgroundColor: '#5E7D61',
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  goalDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#5E7D61',
    position: 'absolute',
    bottom: 3,
  },
  selectedGoalDot: {
    backgroundColor: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  selectedDate: {
    fontSize: 12,
    color: '#777',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 25,
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E8EEE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#49684D',
  },
  goalInfo: {
    flex: 1,
    marginLeft: 14,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  goalDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  arrow: {
    fontSize: 25,
    color: '#999',
  },
  noticeCard: {
    backgroundColor: '#F0EDE6',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  noticeEmoji: {
    fontSize: 26,
    marginRight: 14,
  },
  noticeInfo: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  noticeDescription: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  addButton: {
    backgroundColor: '#5E7D61',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
