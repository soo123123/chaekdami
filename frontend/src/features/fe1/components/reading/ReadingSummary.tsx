import { StyleSheet, Text } from 'react-native';
import { colors } from '../../constants/theme';
import type { ReadingSummary as Summary } from '../../types/reading';
import { formatDate, formatDuration } from '../../utils/format';
import { Card } from '../common/Card';
import { StatRow } from './StatRow';

type ReadingSummaryProps = { summary: Summary | null; startedAt?: string };

/**
 * 총 독서 시간 / 독서 기간 / 평균 독서 시간.
 * 데이터 조회·가공은 FE2 담당 범위이며 이 컴포넌트는 전달받은 값을 표시만 한다.
 */
export function ReadingSummary({ summary, startedAt }: ReadingSummaryProps) {
  return (
    <Card>
      <StatRow
        items={[
          { icon: '🕒', label: '총 독서 시간', value: summary ? formatDuration(summary.totalReadingSeconds) : '-' },
          { icon: '🗓', label: '독서 기간', value: summary ? `${summary.readingDays}일` : '-', caption: startedAt ? `${formatDate(startedAt)} ~ 현재` : undefined },
          { icon: '📖', label: '평균 독서 시간', value: summary ? `${formatDuration(summary.averageSecondsPerDay)}/일` : '-' },
        ]}
      />
      {!summary ? <Text style={styles.note}>아직 독서 기록이 없어요. 첫 독서를 시작해보세요!</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  note: { fontSize: 13, color: colors.secondaryText, textAlign: 'center' },
});
