import type { ReadingTimeSummary as Summary } from '../../types/reading';
import { formatDuration } from '../../utils/format';
import { Card } from '../common/Card';
import { StatRow } from './StatRow';

/**
 * 오늘 / 이번 책 / 이번 주 독서 시간.
 * 통계 데이터는 FE2 담당 — 연동 방식 확정 전에는 '-'로 표시한다.
 */
export function ReadingTimeSummary({ summary }: { summary: Summary | null }) {
  const show = (seconds?: number) => (seconds === undefined ? '-' : formatDuration(seconds));
  return (
    <Card>
      <StatRow
        items={[
          { icon: '🕒', label: '오늘 독서 시간', value: show(summary?.todaySeconds) },
          { icon: '📖', label: '이번 책 독서 시간', value: show(summary?.bookSeconds) },
          { icon: '📊', label: '이번 주 독서 시간', value: show(summary?.weekSeconds) },
        ]}
      />
    </Card>
  );
}
