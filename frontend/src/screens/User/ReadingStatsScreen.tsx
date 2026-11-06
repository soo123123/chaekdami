
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

import {
  getReadingStats,
  type ReadingStats,
} from '../../api/readingStatsApi';

type Period = 'day' | 'week' | 'month';

type ChartItem = {
  label: string;
  minutes: number;
};

const C = {
  bg: '#FAF6F0',
  white: '#FFFDFB',
  green: '#315D49',
  greenDark: '#173F32',
  greenLight: '#C3D5C9',
  text: '#211E1B',
  muted: '#77736F',
  beige: '#E1C3A3',
  orange: '#E89A56',
  gray: '#D4D5D4',
  border: '#EFE8E0',
};

const ART = {
  banner: require('../../../assets/images/stats/stats-banner.png'),
  cat: require('../../../assets/images/stats/stats-cat.png'),
  bookshelf: require('../../../assets/images/stats/stats-bookshelf.png'),
  chart: require('../../../assets/images/stats/stats-chart-icon.png'),
};

const SAMPLE_STATS: ReadingStats = {
  totalMinutes: 750,
  averageMinutes: 25,
  completedBooks: 3,
  totalPages: 245,
  readingDays: 12,
  goalBooks: 3,
  goalTarget: 5,
  weekly: [
    { label: '월', minutes: 20 },
    { label: '화', minutes: 35 },
    { label: '수', minutes: 15 },
    { label: '목', minutes: 50 },
    { label: '금', minutes: 30 },
    { label: '토', minutes: 60 },
    { label: '일', minutes: 40 },
  ],
  monthly: [
    { label: '1주', minutes: 180 },
    { label: '2주', minutes: 240 },
    { label: '3주', minutes: 150 },
    { label: '4주', minutes: 180 },
  ],
};

const SAMPLE_DAILY: ChartItem[] = [
  { label: '06시', minutes: 10 },
  { label: '09시', minutes: 20 },
  { label: '12시', minutes: 40 },
  { label: '15시', minutes: 15 },
  { label: '18시', minutes: 60 },
  { label: '21시', minutes: 35 },
];

const SAMPLE_MONTH_DAYS = [
  20, 50, 60, 115, 25, 55, 70, 160, 120, 80,
  40, 130, 200, 110, 75, 115, 60, 80, 45, 160,
  120, 160, 110, 205, 135, 60, 25, 130, 75, 110,
];

const GENRES = [
  { name: '자기계발', percent: 40, color: C.green },
  { name: '소설', percent: 32, color: C.beige },
  { name: '에세이', percent: 20, color: C.orange },
  { name: '기타', percent: 8, color: C.gray },
];

function formatMinutes(value: number): string {
  const minutes = Math.max(0, Math.round(value || 0));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${rest}분`;
  if (rest === 0) return `${hours}시간`;

  return `${hours}시간 ${rest}분`;
}

function getPeriodDate(period: Period, offset: number): Date {
  const date = new Date();

  if (period === 'month') {
    date.setDate(1);
    date.setMonth(date.getMonth() + offset);
  } else if (period === 'week') {
    date.setDate(date.getDate() + offset * 7);
  } else {
    date.setDate(date.getDate() + offset);
  }

  return date;
}

function getPeriodTitle(period: Period, offset: number): string {
  const date = getPeriodDate(period, offset);

  if (period === 'month') {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
  }

  if (period === 'day') {
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  }

  const start = new Date(date);
  start.setDate(date.getDate() - ((date.getDay() + 6) % 7));

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return (
    `${start.getMonth() + 1}/${start.getDate()}` +
    ` ~ ${end.getMonth() + 1}/${end.getDate()}`
  );
}

function polarPoint(
  center: number,
  radius: number,
  angleDegrees: number
) {
  const angle = (angleDegrees * Math.PI) / 180;

  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  };
}

function createArcPath(
  center: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarPoint(center, radius, startAngle);
  const end = polarPoint(center, radius, endAngle);

  const sweep = endAngle - startAngle;
  const largeArc = sweep > 180 ? 1 : 0;

  return (
    `M ${start.x} ${start.y} ` +
    `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`
  );
}

function GenreDonutChart() {
  const size = 140;
  const center = size / 2;
  const radius = 50;
  const strokeWidth = 23;

  let currentAngle = -90;

  return (
    <View style={styles.donutContainer}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {GENRES.map((genre) => {
          const startAngle = currentAngle;
          const endAngle = startAngle + genre.percent * 3.6;

          currentAngle = endAngle;

          return (
            <Path
              key={genre.name}
              d={createArcPath(
                center,
                radius,
                startAngle,
                endAngle
              )}
              fill="none"
              stroke={genre.color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
            />
          );
        })}
      </Svg>

      <View style={styles.donutCenter}>
        <Text style={styles.donutSmall}>총 독서 시간</Text>
        <Text style={styles.donutValue}>12시간</Text>
        <Text style={styles.donutValue}>30분</Text>
      </View>
    </View>
  );
}

function ReadingBarChart({
  data,
  selectedIndex,
  onSelect,
}: {
  data: ChartItem[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}) {
  const chartHeight = 172;

  const maxMinutes = Math.max(
    240,
    ...data.map((item) => item.minutes)
  );

  if (data.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Ionicons
          name="bar-chart-outline"
          size={34}
          color={C.greenLight}
        />
        <Text style={styles.emptyText}>
          이 기간의 상세 독서 기록이 없어요.
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.graph}>
        <View style={styles.yLabels}>
          {[4, 3, 2, 1, 0].map((number) => (
            <Text key={number} style={styles.axisLabel}>
              {number === 0 ? '0' : `${number}시간`}
            </Text>
          ))}
        </View>

        <View style={styles.graphMain}>
          <View style={styles.gridLines}>
            {[0, 1, 2, 3, 4].map((index) => (
              <View key={index} style={styles.gridLine} />
            ))}
          </View>

          <View style={styles.barsRow}>
            {data.map((item, index) => {
              const height = Math.max(
                3,
                (item.minutes / maxMinutes) * chartHeight
              );

              return (
                <TouchableOpacity
                  key={`${item.label}-${index}`}
                  style={styles.barColumn}
                  onPress={() => onSelect(index)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.bar,
                      {
                        height,
                        backgroundColor:
                          selectedIndex === index
                            ? C.green
                            : C.greenLight,
                      },
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.xAxis}>
        {data.length > 20 ? (
          <View style={styles.monthLabels}>
            {[1, 5, 10, 15, 20, 25, 30].map((day) => (
              <Text key={day} style={styles.monthLabel}>
                {day}
              </Text>
            ))}
          </View>
        ) : (
          <View style={styles.shortLabels}>
            {data.map((item, index) => (
              <Text
                key={`${item.label}-${index}`}
                style={styles.shortLabel}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            ))}
          </View>
        )}
      </View>
    </>
  );
}

export default function ReadingStatsScreen() {
  const [period, setPeriod] = useState<Period>('month');
  const [offset, setOffset] = useState(0);
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingSample, setUsingSample] = useState(false);
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const result = await getReadingStats();

        if (active) {
          setStats(result);
          setUsingSample(false);
        }
      } catch (error) {
        console.log('독서 통계 조회 실패:', error);

        if (active) {
          setStats(SAMPLE_STATS);
          setUsingSample(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const chartData = useMemo<ChartItem[]>(() => {
    if (!stats || offset !== 0) return [];

    if (period === 'day') return SAMPLE_DAILY;
    if (period === 'week') return stats.weekly;

    if (usingSample) {
      const date = getPeriodDate('month', offset);

      const daysInMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
      ).getDate();

      return Array.from(
        { length: daysInMonth },
        (_, index) => ({
          label: String(index + 1),
          minutes: SAMPLE_MONTH_DAYS[index] ?? 0,
        })
      );
    }

    return stats.monthly;
  }, [period, offset, stats, usingSample]);

  if (loading || !stats) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={C.green} />
        <Text style={styles.loadingText}>
          독서 통계를 불러오는 중...
        </Text>
      </View>
    );
  }

  const totalMinutes =
    period === 'month' && offset === 0
      ? stats.totalMinutes
      : chartData.reduce(
          (sum, item) => sum + item.minutes,
          0
        );

  const selected =
    selectedBar === null
      ? null
      : chartData[selectedBar] ?? null;

  const changePeriod = (next: Period) => {
    setPeriod(next);
    setOffset(0);
    setSelectedBar(null);
  };

  const changeDate = (direction: number) => {
    setOffset((previous) => Math.min(0, previous + direction));
    setSelectedBar(null);
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/user/mypage');
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* 상단 배너 */}
        <View style={styles.hero}>
          <Image
            source={ART.banner}
            style={styles.heroBackground}
            resizeMode="cover"
          />

          <View style={styles.heroOverlay} />

          <View style={styles.heroTextArea}>
            <View style={styles.heroTitleRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={goBack}
              >
                <Ionicons
                  name="chevron-back"
                  size={26}
                  color={C.text}
                />
              </TouchableOpacity>

              <Text style={styles.heroTitle}>
                독서 통계
              </Text>
            </View>

            <Text style={styles.heroQuote}>
              조금씩, 꾸준히.{"\n"}
              그게 큰 변화를 만들어요.
            </Text>
          </View>
        </View>

        {/* 일 / 주 / 달 */}
        <View style={styles.periodContainer}>
          {(
            [
              { key: 'day', label: '일' },
              { key: 'week', label: '주' },
              { key: 'month', label: '달' },
            ] as const
          ).map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.periodButton,
                period === item.key && styles.periodActive,
              ]}
              onPress={() => changePeriod(item.key)}
            >
              <Text
                style={[
                  styles.periodLabel,
                  period === item.key &&
                    styles.periodLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 날짜 이동 */}
        <View style={styles.dateNavigation}>
          <TouchableOpacity
            style={styles.dateArrow}
            onPress={() => changeDate(-1)}
          >
            <Ionicons
              name="chevron-back"
              size={23}
              color={C.text}
            />
          </TouchableOpacity>

          <Text style={styles.dateTitle}>
            {getPeriodTitle(period, offset)}
          </Text>

          <TouchableOpacity
            style={styles.dateArrow}
            disabled={offset >= 0}
            onPress={() => changeDate(1)}
          >
            <Ionicons
              name="chevron-forward"
              size={23}
              color={offset >= 0 ? '#CCC5BE' : C.text}
            />
          </TouchableOpacity>
        </View>

        {/* 독서량 */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {period === 'month'
              ? '월별 독서량'
              : period === 'week'
                ? '주간 독서량'
                : '오늘의 독서량'}
          </Text>

          <View style={styles.chartSummary}>
            <View style={styles.chartSummaryText}>
              <Text style={styles.mutedLabel}>
                총 독서 시간
              </Text>

              <Text style={styles.totalValue}>
                {formatMinutes(totalMinutes)}
              </Text>
            </View>

            <View style={styles.tipBox}>
              <Image
                source={ART.chart}
                style={styles.tipIcon}
                resizeMode="contain"
              />

              <Text style={styles.tipText}>
                조금씩 쌓이는{'\n'}
                나만의 독서 기록!
              </Text>
            </View>
          </View>

          <ReadingBarChart
            data={chartData}
            selectedIndex={selectedBar}
            onSelect={setSelectedBar}
          />

          {selected && (
            <Text style={styles.selectedInfo}>
              {selected.label}
              {period === 'month' && chartData.length > 20
                ? '일'
                : ''}
              {' · '}
              {formatMinutes(selected.minutes)}
            </Text>
          )}

          {(period === 'day' ||
            (usingSample &&
              period === 'month' &&
              offset === 0)) && (
            <Text style={styles.exampleNote}>
              * 날짜별 세부 기록은 화면 확인용 예시입니다.
            </Text>
          )}
        </View>

        {/* 카테고리별 독서 비율 */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            카테고리별 독서 비율
          </Text>

          <View style={styles.genreContent}>
            <GenreDonutChart />

            <View style={styles.genreLegend}>
              {GENRES.map((genre) => (
                <View
                  key={genre.name}
                  style={styles.genreRow}
                >
                  <View
                    style={[
                      styles.genreDot,
                      { backgroundColor: genre.color },
                    ]}
                  />

                  <Text style={styles.genreName}>
                    {genre.name}
                  </Text>

                  <Text style={styles.genrePercent}>
                    {genre.percent}%
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.exampleNote}>
            * 카테고리 비율은 API 연동 전 예시입니다.
          </Text>
        </View>

        {/* 하단 통계 카드 */}
        <View style={styles.bottomRow}>
          <View style={styles.infoCard}>
            <View style={styles.infoTop}>
              <Text style={styles.infoTitle}>
                일 평균 독서량
              </Text>

              <Image
                source={ART.chart}
                style={styles.infoIcon}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.infoValue}>
              {formatMinutes(stats.averageMinutes)}
            </Text>

            <Text style={styles.infoDescription}>
              조금씩 성장하고 있어요!
            </Text>
          </View>

          <TouchableOpacity
            style={styles.infoCard}
            onPress={() =>
              router.push('/reward/dday' as never)
            }
          >
            <View style={styles.infoTop}>
              <Text style={styles.infoTitle}>
                연속 독서 기록
              </Text>

              <Ionicons
                name="flame"
                size={25}
                color={C.orange}
              />
            </View>

            <Text style={styles.infoValue}>
              {stats.readingDays}일
            </Text>

            <Text style={styles.infoDescription}>
              지금처럼 꾸준히 이어가요!
            </Text>
          </TouchableOpacity>
        </View>

        {/* 하단 일러스트 */}
        <View style={styles.bottomDecoration}>
          <Image
            source={ART.cat}
            style={styles.bottomCat}
            resizeMode="contain"
          />

          <Image
            source={ART.bookshelf}
            style={styles.bottomBookshelf}
            resizeMode="contain"
          />
        </View>

        {usingSample && (
          <Text style={styles.sampleNote}>
            현재 서버 연결 대신 예시 통계를 표시하고 있습니다.
          </Text>
        )}

        <TouchableOpacity
          style={styles.myPageButton}
          onPress={() => router.push('/user/mypage')}
        >
          <Text style={styles.myPageText}>
            마이페이지로 돌아가기
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingHorizontal: 14,
    paddingTop: 15,
    paddingBottom: 40,
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.bg,
  },

  loadingText: {
    marginTop: 12,
    color: C.muted,
  },

  hero: {
    width: '100%',
    height: 165,
    borderRadius: 23,
    backgroundColor: '#F2E5D5',
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },

  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },

  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '56%',
    backgroundColor: 'transparent',
  },

  heroTextArea: {
    position: 'relative',
    zIndex: 2,
    width: '65%',
    height: '100%',
    paddingLeft: 14,
    paddingTop: 15,
  },

  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    marginRight: 5,
    paddingVertical: 3,
  },

  heroTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: C.text,
  },

  // 작은 설명 글씨를 검정색으로 변경
  heroQuote: {
    marginTop: 22,
    marginLeft: 4,
    fontSize: 13,
    lineHeight: 22,
    color: '#111111',
    fontWeight: '600',
  },

  periodContainer: {
    flexDirection: 'row',
    padding: 5,
    backgroundColor: '#EAE5DE',
    borderRadius: 30,
    marginBottom: 9,
  },

  periodButton: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
  },

  periodActive: {
    backgroundColor: C.green,
  },

  periodLabel: {
    color: '#4B4743',
    fontSize: 15,
    fontWeight: '700',
  },

  periodLabelActive: {
    color: '#FFFFFF',
  },

  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 12,
  },

  dateArrow: {
    padding: 8,
  },

  dateTitle: {
    minWidth: 155,
    textAlign: 'center',
    fontSize: 19,
    fontWeight: '800',
    color: C.text,
  },

  card: {
    backgroundColor: C.white,
    borderRadius: 23,
    padding: 16,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: C.border,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: C.text,
    marginBottom: 17,
  },

  chartSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 19,
  },

  chartSummaryText: {
    flex: 1,
    minWidth: 0,
  },

  mutedLabel: {
    color: C.muted,
    fontSize: 12,
    marginBottom: 6,
  },

  totalValue: {
    color: C.greenDark,
    fontSize: 27,
    fontWeight: '900',
  },

  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF1EA',
    borderRadius: 13,
    padding: 8,
    gap: 6,
  },

  tipIcon: {
    width: 28,
    height: 28,
  },

  tipText: {
    fontSize: 10,
    lineHeight: 16,
    color: C.greenDark,
  },

  graph: {
    flexDirection: 'row',
    height: 172,
  },

  yLabels: {
    width: 39,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 5,
  },

  axisLabel: {
    fontSize: 9,
    color: C.muted,
  },

  graphMain: {
    flex: 1,
    height: 172,
    position: 'relative',
  },

  gridLines: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },

  gridLine: {
    height: 1,
    backgroundColor: '#EAE5DF',
  },

  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 172,
  },

  barColumn: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 1,
  },

  bar: {
    width: '100%',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },

  xAxis: {
    marginLeft: 39,
    marginTop: 8,
  },

  monthLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },

  monthLabel: {
    fontSize: 10,
    color: C.muted,
    textAlign: 'center',
  },

  shortLabels: {
    flexDirection: 'row',
  },

  shortLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    color: C.muted,
  },

  selectedInfo: {
    textAlign: 'center',
    color: C.green,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },

  emptyChart: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  emptyText: {
    color: C.muted,
    fontSize: 12,
  },

  exampleNote: {
    color: '#9B948C',
    fontSize: 10,
    marginTop: 13,
  },

  genreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  donutContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },

  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  donutSmall: {
    fontSize: 10,
    color: C.muted,
  },

  donutValue: {
    fontSize: 13,
    fontWeight: '900',
    color: C.greenDark,
  },

  genreLegend: {
    flex: 1,
    gap: 4,
  },

  genreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1EDE7',
  },

  genreDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  genreName: {
    flex: 1,
    fontSize: 11,
    color: C.text,
  },

  genrePercent: {
    fontSize: 12,
    fontWeight: '800',
    color: C.text,
  },

  bottomRow: {
    flexDirection: 'row',
    gap: 10,
  },

  infoCard: {
    flex: 1,
    minHeight: 150,
    backgroundColor: C.white,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },

  infoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5,
  },

  infoTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: C.text,
  },

  infoIcon: {
    width: 28,
    height: 28,
  },

  infoValue: {
    color: C.greenDark,
    fontSize: 29,
    fontWeight: '900',
    marginTop: 14,
  },

  infoDescription: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },

  bottomDecoration: {
    minHeight: 110,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },

  bottomCat: {
    width: 95,
    height: 90,
  },

  bottomBookshelf: {
    width: 180,
    height: 90,
  },

  sampleNote: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 11,
    color: C.muted,
  },

  myPageButton: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#C9D6CB',
    borderRadius: 15,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: C.white,
  },

  myPageText: {
    color: C.green,
    fontWeight: '800',
    fontSize: 14,
  },
});
