import { StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/common/Icon';
import type { CompleteRecord } from '../../types/readingComplete';
import { cardStyle, COMPLETE_COLORS } from './theme';

type Props = { record: CompleteRecord };

/** 분 → "1시간 20분" */
function formatMinutes(minutes: number) {
  const total = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours === 0) return `${rest}분`;
  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
}

/** 오늘의 독서 기록: 독서 시간 / 읽은 페이지 / 독서 집중도 */
export function ReadingResultCard({ record }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>오늘의 독서 기록</Text>
      <View style={styles.row}>
        <StatItem
          icon="clock"
          label="독서 시간"
          value={formatMinutes(record.durationMinutes)}
          sub={`목표 ${formatMinutes(record.goalMinutes)}`}
        />
        <View style={styles.divider} />
        <StatItem
          icon="bookOpenOutline"
          label="읽은 페이지"
          value={`${Math.floor(record.pagesRead)} 페이지`}
          sub={`목표 ${record.goalPages} 페이지`}
        />
        <View style={styles.divider} />
        <StatItem
          icon="stats"
          label="독서 집중도"
          value={`${Math.min(100, Math.round(record.focusPercent))}%`}
          sub={record.focusModeUsed ? '집중 모드 사용' : '일반 모드'}
        />
      </View>
    </View>
  );
}

type StatItemProps = { icon: IconName; label: string; value: string; sub: string };

function StatItem({ icon, label, value, sub }: StatItemProps) {
  return (
    <View style={styles.item}>
      <View style={styles.labelRow}>
        <Icon name={icon} size={20} color={COMPLETE_COLORS.text} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.sub} numberOfLines={1}>
        {sub}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { ...cardStyle, padding: 18, gap: 16 },
  title: { fontSize: 17, fontWeight: '800', color: COMPLETE_COLORS.text },
  row: { flexDirection: 'row' },
  divider: { width: 1, backgroundColor: COMPLETE_COLORS.border, marginHorizontal: 8 },
  item: { flex: 1, gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  label: { fontSize: 12, color: COMPLETE_COLORS.text },
  value: { fontSize: 19, fontWeight: '800', color: COMPLETE_COLORS.text },
  sub: { fontSize: 11, color: COMPLETE_COLORS.secondary },
});
