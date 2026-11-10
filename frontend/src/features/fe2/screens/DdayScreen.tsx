
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Goal = {
  id: number;
  title: string;
  targetDate: string;
  targetBooks: number;
  completedBooks: number;
};

type Status = 'read' | 'protected' | 'missed' | 'future';

type ReadingRecords = Record<string, 'read' | 'protected'>;

const STORAGE_GOALS = '@chaekdami_dday_goals';
const STORAGE_RECORDS = '@chaekdami_dday_records';

const C = {
  bg: '#FAF6F0',
  white: '#FFFDF9',
  green: '#355C49',
  darkGreen: '#173F32',
  paleGreen: '#E9EFE7',
  cream: '#F8F1E5',
  text: '#292520',
  muted: '#827B73',
  border: '#EEE7DE',
  orange: '#F47C3B',
};

const ART = {
  header: require('../../../../assets/images/dday/dday-header-cat.png'),
  success: require('../../../../assets/images/dday/dday-read-success.png'),
  shield: require('../../../../assets/images/dday/dday-shield-used.png'),
  missed: require('../../../../assets/images/dday/dday-missed.png'),
};

// 기존 디자인 확인용 2025년 9월 예시 기록
// 실제 백엔드 연결 시 이 데이터를 API 결과로 교체하면 됩니다.
const DEMO_RECORDS: ReadingRecords = {};

for (let day = 1; day <= 20; day++) {
  const key = `2025-09-${String(day).padStart(2, '0')}`;
  DEMO_RECORDS[key] = 'read';
}

DEMO_RECORDS['2025-09-09'] = 'protected';
DEMO_RECORDS['2025-09-17'] = 'protected';

const INITIAL_GOALS: Goal[] = [
  {
    id: 1,
    title: '현재 읽는 책 완독하기',
    targetDate: '2026-10-30',
    targetBooks: 1,
    completedBooks: 0,
  },
  {
    id: 2,
    title: '이번 달 독서 목표 달성',
    targetDate: '2026-10-31',
    targetBooks: 5,
    completedBooks: 3,
  },
];

function dateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  return dateString(parseDate(value)) === value;
}

function daysRemaining(value: string): number {
  const now = new Date();
  const target = parseDate(value);

  const todayUTC = Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const targetUTC = Date.UTC(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );

  return Math.round((targetUTC - todayUTC) / 86400000);
}

function ddayLabel(days: number): string {
  if (days === 0) return 'D-DAY';
  if (days > 0) return `D-${days}`;

  return `D+${Math.abs(days)}`;
}

function progress(goal: Goal): number {
  if (goal.targetBooks <= 0) return 0;

  return Math.min(
    100,
    Math.round((goal.completedBooks / goal.targetBooks) * 100)
  );
}

function calculateStreak(records: ReadingRecords) {
  const dates = Object.keys(records)
    .filter((date) => records[date] === 'read' || records[date] === 'protected')
    .sort();

  let totalRead = 0;
  let totalProtected = 0;
  let longestStreak = 0;
  let currentStreak = 0;
  let previousDate: string | null = null;

  for (const date of dates) {
    if (records[date] === 'read') {
      totalRead++;
    } else {
      totalProtected++;
    }

    if (previousDate) {
      const previous = parseDate(previousDate);
      previous.setDate(previous.getDate() + 1);

      if (dateString(previous) === date) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }

    longestStreak = Math.max(longestStreak, currentStreak);
    previousDate = date;
  }

  return {
    totalRead,
    totalProtected,
    totalMaintained: totalRead + totalProtected,
    longestStreak,
  };
}

export default function DdayScreen() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState(
    dateString(new Date())
  );

  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [records, setRecords] = useState<ReadingRecords>(DEMO_RECORDS);

  const [loaded, setLoaded] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [targetBooks, setTargetBooks] = useState('1');
  const [completedBooks, setCompletedBooks] = useState('0');
  const [error, setError] = useState('');

  const today = dateString(new Date());
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // 저장된 목표 및 기록 불러오기
  useEffect(() => {
    async function loadData() {
      try {
        const [savedGoals, savedRecords] = await Promise.all([
          AsyncStorage.getItem(STORAGE_GOALS),
          AsyncStorage.getItem(STORAGE_RECORDS),
        ]);

        if (savedGoals !== null) {
          const parsedGoals = JSON.parse(savedGoals);

          if (Array.isArray(parsedGoals)) {
            setGoals(parsedGoals);
          }
        }

        if (savedRecords !== null) {
          const parsedRecords = JSON.parse(savedRecords);

          if (
            parsedRecords &&
            typeof parsedRecords === 'object' &&
            !Array.isArray(parsedRecords)
          ) {
            setRecords(parsedRecords);
          }
        }
      } catch (e) {
        console.warn('D-day 데이터 불러오기 실패:', e);
      } finally {
        setLoaded(true);
      }
    }

    loadData();
  }, []);

  // 목표 변경 시 자동 저장
  useEffect(() => {
    if (!loaded) return;

    AsyncStorage.setItem(
      STORAGE_GOALS,
      JSON.stringify(goals)
    ).catch((e) => {
      console.warn('목표 저장 실패:', e);
    });
  }, [goals, loaded]);

  // 독서 기록 변경 시 자동 저장
  useEffect(() => {
    if (!loaded) return;

    AsyncStorage.setItem(
      STORAGE_RECORDS,
      JSON.stringify(records)
    ).catch((e) => {
      console.warn('독서 기록 저장 실패:', e);
    });
  }, [records, loaded]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();

    const result: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      result.push(null);
    }

    for (let day = 1; day <= lastDay; day++) {
      result.push(day);
    }

    while (result.length % 7 !== 0) {
      result.push(null);
    }

    return result;
  }, [year, month]);

  const getStatus = (date: string): Status => {
    if (date > today) {
      return 'future';
    }

    return records[date] ?? 'missed';
  };

  const monthlyStats = useMemo(() => {
    let read = 0;
    let protectedDays = 0;
    let missed = 0;

    const lastDay = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= lastDay; day++) {
      const date = dateString(new Date(year, month, day));

      if (date > today) {
        continue;
      }

      if (records[date] === 'read') {
        read++;
      } else if (records[date] === 'protected') {
        protectedDays++;
      } else {
        missed++;
      }
    }

    return {
      read,
      protectedDays,
      missed,
    };
  }, [year, month, records, today]);

  const summary = useMemo(
    () => calculateStreak(records),
    [records]
  );

  const sortedGoals = useMemo(() => {
    return [...goals].sort(
      (a, b) =>
        parseDate(a.targetDate).getTime() -
        parseDate(b.targetDate).getTime()
    );
  }, [goals]);

  const nextGoal = sortedGoals.find(
    (goal) =>
      daysRemaining(goal.targetDate) >= 0 &&
      goal.completedBooks < goal.targetBooks
  );

  const mainDays = nextGoal
    ? daysRemaining(nextGoal.targetDate)
    : null;

  const changeMonth = (amount: number) => {
    setCurrentMonth(
      new Date(year, month + amount, 1)
    );
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/fe2/user/mypage');
    }
  };

  const createGoal = () => {
    setEditingId(null);
    setTitle('');
    setTargetDate(selectedDate >= today ? selectedDate : today);
    setTargetBooks('1');
    setCompletedBooks('0');
    setError('');
    setModalOpen(true);
  };

  const editGoal = (goal: Goal) => {
    setEditingId(goal.id);
    setTitle(goal.title);
    setTargetDate(goal.targetDate);
    setTargetBooks(String(goal.targetBooks));
    setCompletedBooks(String(goal.completedBooks));
    setError('');
    setModalOpen(true);
  };

  const saveGoal = () => {
    const target = Number(targetBooks);
    const completed = Number(completedBooks);

    if (!title.trim()) {
      setError('목표 이름을 입력해 주세요.');
      return;
    }

    if (!validDate(targetDate)) {
      setError('날짜는 YYYY-MM-DD 형식으로 입력해 주세요.');
      return;
    }

    if (
      !Number.isInteger(target) ||
      target < 1 ||
      !Number.isInteger(completed) ||
      completed < 0 ||
      completed > target
    ) {
      setError('목표 권수와 완료 권수를 확인해 주세요.');
      return;
    }

    const nextGoal: Goal = {
      id: editingId ?? Date.now(),
      title: title.trim(),
      targetDate,
      targetBooks: target,
      completedBooks: completed,
    };

    setGoals((previous) => {
      if (editingId === null) {
        return [...previous, nextGoal];
      }

      return previous.map((goal) =>
        goal.id === editingId ? nextGoal : goal
      );
    });

    const date = parseDate(targetDate);

    setCurrentMonth(
      new Date(date.getFullYear(), date.getMonth(), 1)
    );

    setSelectedDate(targetDate);
    setModalOpen(false);
  };

  const deleteGoal = () => {
    if (editingId === null) return;

    const remove = () => {
      setGoals((previous) =>
        previous.filter((goal) => goal.id !== editingId)
      );

      setModalOpen(false);
    };

    if (Platform.OS === 'web') {
      remove();
    } else {
      Alert.alert(
        '목표 삭제',
        '이 목표를 삭제할까요?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: remove,
          },
        ]
      );
    }
  };

  // 날짜를 누르면 기록 상태를 변경할 수 있음
  // 미달성 -> 직접 독서 -> 아이템 사용 -> 미달성
  const changeRecord = (date: string) => {
    if (date > today) return;

    setSelectedDate(date);

    setRecords((previous) => {
      const next = { ...previous };
      const current = next[date];

      if (!current) {
        next[date] = 'read';
      } else if (current === 'read') {
        next[date] = 'protected';
      } else {
        delete next[date];
      }

      return next;
    });
  };

  const renderDay = (day: number | null, index: number) => {
    if (day === null) {
      return (
        <View
          key={`empty-${index}`}
          style={styles.dayContainer}
        />
      );
    }

    const date = dateString(new Date(year, month, day));
    const status = getStatus(date);
    const selected = selectedDate === date;
    const isToday = date === today;

    const image =
      status === 'read'
        ? ART.success
        : status === 'protected'
        ? ART.shield
        : ART.missed;

    return (
      <TouchableOpacity
        key={date}
        style={styles.dayContainer}
        onPress={() => changeRecord(date)}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.dayTile,
            status === 'protected' && styles.protectedTile,
            (selected || isToday) && styles.selectedTile,
          ]}
        >
          <Text
            style={[
              styles.dayNumber,
              index % 7 === 0 && styles.sundayNumber,
              (selected || isToday) && styles.selectedDayNumber,
            ]}
          >
            {day}
          </Text>

          <Image
            source={image}
            style={[
              styles.dayImage,
              (status === 'missed' || status === 'future') &&
                styles.missedImage,
            ]}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* 상단 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={goBack}
            style={styles.backButton}
          >
            <Ionicons
              name="chevron-back"
              size={25}
              color={C.text}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            D-day 기록
          </Text>

          <TouchableOpacity
            style={styles.addButton}
            onPress={createGoal}
          >
            <Ionicons
              name="add"
              size={22}
              color={C.green}
            />
          </TouchableOpacity>
        </View>

        {/* 고양이 메인 배너 */}
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Text style={styles.heroLabel}>
              현재 D-day
            </Text>

            <View style={styles.heroCountRow}>
              <Text style={styles.fireEmoji}>
                🔥
              </Text>

              <Text style={styles.heroCount}>
                {mainDays === null
                  ? '목표'
                  : mainDays === 0
                  ? '오늘'
                  : `${mainDays}일`}
              </Text>
            </View>

            <Text style={styles.heroQuote}>
              {'“조금씩, 꾸준히.\n그게 큰 변화를 만들어요.”'}
            </Text>
          </View>

          <Image
            source={ART.header}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>

        {/* 전체 독서 통계 */}
        <View style={styles.summaryCard}>
          {[
            {
              icon: 'book-outline',
              label: '총 유지 기간',
              value: `${summary.totalMaintained}일`,
            },
            {
              icon: 'flame',
              label: '직접 유지한 날',
              value: `${summary.totalRead}일`,
            },
            {
              icon: 'shield-checkmark',
              label: '아이템 사용',
              value: `${summary.totalProtected}일`,
            },
            {
              icon: 'calendar-outline',
              label: '최대 연속',
              value: `${summary.longestStreak}일`,
            },
          ].map((item, index) => (
            <View
              key={item.label}
              style={[
                styles.summaryItem,
                index < 3 && styles.summaryDivider,
              ]}
            >
              <Ionicons
                name={item.icon as any}
                size={23}
                color={index === 1 ? C.orange : C.green}
              />

              <Text style={styles.summaryLabel}>
                {item.label}
              </Text>

              <Text style={styles.summaryValue}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        {/* 달력 */}
        <View style={styles.calendarCard}>
          <View style={styles.monthHeader}>
            <TouchableOpacity
              onPress={() => changeMonth(-1)}
              style={styles.monthArrow}
            >
              <Ionicons
                name="chevron-back"
                size={23}
                color={C.muted}
              />
            </TouchableOpacity>

            <Text style={styles.monthTitle}>
              {year}년 {month + 1}월
            </Text>

            <TouchableOpacity
              onPress={() => changeMonth(1)}
              style={styles.monthArrow}
            >
              <Ionicons
                name="chevron-forward"
                size={23}
                color={C.muted}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {['일', '월', '화', '수', '목', '금', '토'].map(
              (day) => (
                <Text
                  key={day}
                  style={styles.weekText}
                >
                  {day}
                </Text>
              )
            )}
          </View>

          <View style={styles.calendarGrid}>
            {calendarDays.map(renderDay)}
          </View>

          <View style={styles.legend}>
            {[
              {
                image: ART.success,
                label: '직접 유지',
              },
              {
                image: ART.shield,
                label: '아이템 사용',
              },
              {
                image: ART.missed,
                label: '미달성',
              },
            ].map((item) => (
              <View
                key={item.label}
                style={styles.legendItem}
              >
                <Image
                  source={item.image}
                  style={styles.legendImage}
                  resizeMode="contain"
                />

                <Text style={styles.legendText}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.calendarHint}>
            날짜를 누르면 독서 완료 → 아이템 사용 → 미달성 순서로 변경돼요.
          </Text>
        </View>

        {/* 이번 달 기록 */}
        <View style={styles.monthRecordCard}>
          <Text style={styles.sectionTitle}>
            이번 달 기록
          </Text>

          <View style={styles.monthStats}>
            {[
              {
                icon: 'flame',
                label: '직접 유지',
                value: `${monthlyStats.read}일`,
                color: C.orange,
              },
              {
                icon: 'shield-checkmark',
                label: '아이템 사용',
                value: `${monthlyStats.protectedDays}일`,
                color: '#6B9279',
              },
              {
                icon: 'ellipse-outline',
                label: '미달성',
                value: `${monthlyStats.missed}일`,
                color: '#BDB8B2',
              },
            ].map((item, index) => (
              <View
                key={item.label}
                style={[
                  styles.monthStat,
                  index < 2 && styles.monthStatDivider,
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={27}
                  color={item.color}
                />

                <Text style={styles.monthStatLabel}>
                  {item.label}
                </Text>

                <Text style={styles.monthStatValue}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.cheerBanner}>
            <Image
              source={ART.header}
              style={styles.cheerImage}
              resizeMode="contain"
            />

            <View style={styles.cheerText}>
              <Text style={styles.cheerTitle}>
                꾸준한 독서 습관이 멋져요!
              </Text>

              <Text style={styles.cheerDescription}>
                이번 달도 좋은 흐름이에요. 🔥
              </Text>
            </View>
          </View>
        </View>

        {/* 나의 독서 목표 */}
        <View style={styles.goalsHeader}>
          <Text style={styles.sectionTitle}>
            나의 독서 목표
          </Text>

          <TouchableOpacity onPress={createGoal}>
            <Text style={styles.addGoalText}>
              + 목표 추가
            </Text>
          </TouchableOpacity>
        </View>

        {sortedGoals.map((goal) => (
          <TouchableOpacity
            key={goal.id}
            style={styles.goalCard}
            onPress={() => editGoal(goal)}
            activeOpacity={0.8}
          >
            <View style={styles.goalBadge}>
              <Text style={styles.goalBadgeText}>
                {ddayLabel(daysRemaining(goal.targetDate))}
              </Text>
            </View>

            <View style={styles.goalContent}>
              <Text style={styles.goalTitle}>
                {goal.title}
              </Text>

              <Text style={styles.goalDate}>
                목표일 {goal.targetDate}
              </Text>

              <Text style={styles.goalProgress}>
                {goal.completedBooks}/{goal.targetBooks}권 ·{' '}
                {progress(goal)}%
              </Text>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progress(goal)}%` },
                  ]}
                />
              </View>
            </View>

            <Ionicons
              name="create-outline"
              size={19}
              color={C.green}
            />
          </TouchableOpacity>
        ))}

        {goals.length === 0 && (
          <View style={styles.emptyGoals}>
            <Text style={styles.emptyText}>
              등록된 독서 목표가 없어요.
            </Text>
          </View>
        )}

        <Text style={styles.demoNotice}>
          현재 독서 기록은 화면 테스트용 데이터이며,
          백엔드 연동 전까지 이 화면에서 직접 변경할 수 있습니다.
        </Text>
      </ScrollView>

      {/* 목표 추가 및 수정 */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={
            Platform.OS === 'ios' ? 'padding' : undefined
          }
        >
          <ScrollView
            contentContainerStyle={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingId === null
                    ? '새 독서 목표'
                    : '독서 목표 수정'}
                </Text>

                <TouchableOpacity
                  onPress={() => setModalOpen(false)}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={C.muted}
                  />
                </TouchableOpacity>
              </View>

              <Image
                source={ART.success}
                style={styles.modalImage}
                resizeMode="contain"
              />

              <Text style={styles.inputLabel}>
                목표 이름
              </Text>

              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="예: 이번 달 책 3권 읽기"
                placeholderTextColor="#AAA39A"
              />

              <Text style={styles.inputLabel}>
                목표 날짜
              </Text>

              <TextInput
                style={styles.input}
                value={targetDate}
                onChangeText={setTargetDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#AAA39A"
              />

              <View style={styles.inputRow}>
                <View style={styles.inputColumn}>
                  <Text style={styles.inputLabel}>
                    목표 권수
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={targetBooks}
                    onChangeText={setTargetBooks}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.inputColumn}>
                  <Text style={styles.inputLabel}>
                    완료 권수
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={completedBooks}
                    onChangeText={setCompletedBooks}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              {!!error && (
                <Text style={styles.errorText}>
                  {error}
                </Text>
              )}

              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveGoal}
              >
                <Text style={styles.saveButtonText}>
                  {editingId === null
                    ? '목표 등록하기'
                    : '수정 내용 저장'}
                </Text>
              </TouchableOpacity>

              {editingId !== null && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={deleteGoal}
                >
                  <Text style={styles.deleteText}>
                    목표 삭제
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },

  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 46,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 42,
  },

  backButton: {
    width: 35,
  },

  headerTitle: {
    flex: 1,
    fontSize: 25,
    fontWeight: '900',
    color: C.text,
  },

  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.paleGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },

  hero: {
    height: 218,
    backgroundColor: C.cream,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 13,
    paddingLeft: 13,
  },

  heroText: {
    width: '43%',
    zIndex: 2,
    justifyContent: 'center',
  },

  heroLabel: {
    fontSize: 12,
    color: C.muted,
    fontWeight: '700',
    marginBottom: 10,
  },

  heroCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  fireEmoji: {
    fontSize: 34,
  },

  heroCount: {
    fontSize: 42,
    fontWeight: '900',
    color: C.darkGreen,
  },

  heroQuote: {
    fontSize: 11,
    lineHeight: 19,
    color: '#795C46',
    marginTop: 17,
  },

  heroImage: {
    width: '57%',
    height: 202,
    alignSelf: 'center',
  },

  summaryCard: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 17,
    marginBottom: 13,
  },

  summaryItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 2,
  },

  summaryDivider: {
    borderRightWidth: 1,
    borderRightColor: C.border,
  },

  summaryLabel: {
    fontSize: 10,
    color: C.muted,
    textAlign: 'center',
  },

  summaryValue: {
    fontSize: 20,
    fontWeight: '900',
    color: C.text,
  },

  calendarCard: {
    backgroundColor: C.white,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 8,
    paddingTop: 19,
    paddingBottom: 16,
    marginBottom: 13,
  },

  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
  },

  monthArrow: {
    paddingHorizontal: 20,
    paddingVertical: 6,
  },

  monthTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: C.text,
  },

  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  weekText: {
    width: '14.2857%',
    textAlign: 'center',
    fontSize: 12,
    color: C.muted,
    paddingVertical: 8,
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  dayContainer: {
    width: '14.2857%',
    height: 76,
    padding: 2,
  },

  dayTile: {
    flex: 1,
    backgroundColor: '#F9F4EC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingTop: 4,
    alignItems: 'center',
    overflow: 'hidden',
  },

  protectedTile: {
    backgroundColor: '#EFEDE8',
  },

  selectedTile: {
    borderWidth: 2,
    borderColor: C.green,
    backgroundColor: '#F3F5EC',
  },

  dayNumber: {
    fontSize: 12,
    color: C.text,
    alignSelf: 'flex-start',
    marginLeft: 5,
  },

  sundayNumber: {
    color: '#CC876D',
  },

  selectedDayNumber: {
    fontWeight: '900',
    color: C.darkGreen,
  },

  dayImage: {
    width: '100%',
    height: 49,
    marginTop: 1,
  },

  missedImage: {
    height: 44,
    opacity: 0.88,
  },

  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 18,
    paddingBottom: 2,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  legendImage: {
    width: 25,
    height: 25,
  },

  legendText: {
    fontSize: 10,
    color: C.muted,
  },

  calendarHint: {
    fontSize: 10,
    color: C.muted,
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 16,
  },

  monthRecordCard: {
    backgroundColor: C.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    padding: 17,
    marginBottom: 22,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: C.text,
  },

  monthStats: {
    flexDirection: 'row',
    marginTop: 23,
    marginBottom: 22,
  },

  monthStat: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },

  monthStatDivider: {
    borderRightWidth: 1,
    borderRightColor: C.border,
  },

  monthStatLabel: {
    fontSize: 11,
    color: C.muted,
  },

  monthStatValue: {
    fontSize: 21,
    fontWeight: '900',
    color: C.text,
  },

  cheerBanner: {
    backgroundColor: C.paleGreen,
    borderRadius: 17,
    minHeight: 100,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  cheerImage: {
    width: 90,
    height: 85,
  },

  cheerText: {
    flex: 1,
    paddingLeft: 10,
  },

  cheerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: C.darkGreen,
  },

  cheerDescription: {
    fontSize: 12,
    color: C.green,
    marginTop: 8,
  },

  goalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },

  addGoalText: {
    color: C.green,
    fontWeight: '800',
    fontSize: 12,
  },

  goalCard: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    minHeight: 106,
  },

  goalBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: C.paleGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },

  goalBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: C.green,
  },

  goalContent: {
    flex: 1,
    marginHorizontal: 13,
  },

  goalTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: C.text,
  },

  goalDate: {
    fontSize: 11,
    color: C.muted,
    marginTop: 5,
  },

  goalProgress: {
    fontSize: 11,
    fontWeight: '800',
    color: C.green,
    marginTop: 7,
  },

  progressTrack: {
    height: 6,
    backgroundColor: '#D9E2D7',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },

  progressFill: {
    height: '100%',
    backgroundColor: C.green,
    borderRadius: 4,
  },

  emptyGoals: {
    backgroundColor: C.white,
    padding: 20,
    borderRadius: 17,
  },

  emptyText: {
    textAlign: 'center',
    color: C.muted,
  },

  demoNotice: {
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 17,
    color: C.muted,
    marginTop: 18,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20,30,23,0.45)',
    justifyContent: 'center',
  },

  modalScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 18,
  },

  modalCard: {
    backgroundColor: C.white,
    borderRadius: 23,
    padding: 21,
    width: '100%',
    maxWidth: 450,
    alignSelf: 'center',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: C.text,
  },

  modalImage: {
    width: 110,
    height: 80,
    alignSelf: 'center',
    marginVertical: 10,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: C.text,
    marginTop: 13,
    marginBottom: 7,
  },

  input: {
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#E6DED3',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: C.text,
  },

  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },

  inputColumn: {
    flex: 1,
  },

  errorText: {
    color: '#B85648',
    fontSize: 12,
    marginTop: 12,
  },

  saveButton: {
    backgroundColor: C.green,
    borderRadius: 13,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },

  deleteButton: {
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 5,
  },

  deleteText: {
    color: '#B85648',
    fontWeight: '800',
    fontSize: 13,
  },
});
