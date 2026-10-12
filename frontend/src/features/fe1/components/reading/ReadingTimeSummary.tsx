import { formatDuration } from '../../utils/format';
import { Card } from '../common/Card';
import { StatRow } from './StatRow';

type ReadingTimeSummaryProps = {
  /** 오늘 독서 시간(초) */
  today?: number;
  /** 이번 책 독서 시간(초) */
  book?: number;
  /** 이번 주 독서 시간(초) */
  week?: number;
};

/**
 * 오늘 / 이번 책 / 이번 주 독서 시간.
 * 통계 데이터는 FE2 담당 — 연동 방식 확정 전에는 '-'로 표시한다.
 */
export function ReadingTimeSummary({ today, book, week }: ReadingTimeSummaryProps) {
  const show = (seconds?: number) => (seconds === undefined ? '-' : formatDuration(seconds));
  return (
    <Card>
      <StatRow
        items={[
          { icon: 'clock', label: '오늘 독서 시간', value: show(today) },
          { icon: 'bookOpenOutline', label: '이번 책 독서 시간', value: show(book) },
          { icon: 'stats', label: '이번 주 독서 시간', value: show(week) },
        ]}
      />
    </Card>
  );
}
