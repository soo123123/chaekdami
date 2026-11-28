import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { HIT_SLOP } from '@/constants/layout';
import { colors, keepAllWords, radius, serifFont, spacing } from '../../constants/theme';
import type { CommunityEntry, CommunityEntryDetail, ContentReportTarget, ReviewReportRequest } from '../../types/community';
import type { AppError } from '../../utils/apiError';
import { formatDate } from '../../utils/format';
import { BottomSheetModal } from '../common/BottomSheetModal';
import { ReviewReportSheet } from './ReviewReportSheet';

type Props = {
  entry: CommunityEntry | null;
  detail: CommunityEntryDetail | null;
  error: AppError | null;
  onClose: () => void;
  onReport: (target: ContentReportTarget, request: ReviewReportRequest) => Promise<boolean>;
};

/**
 * 완독자 기록 상세: 공개한 문장 모음집(날짜별)과 독후감 전체.
 * 다른 사람의 글에는 '신고'가 있다 (TODO-35). 내 글은 신고할 수 없다.
 * 신고 시트는 이 시트 안에 둔다 (iOS에서 모달 두 개를 나란히 띄우면 두 번째가 뜨지 않는다).
 */
export function CommunityEntrySheet({ entry, detail, error, onClose, onReport }: Props) {
  const { height } = useWindowDimensions();
  const [reportTarget, setReportTarget] = useState<ContentReportTarget | null>(null);
  const canReport = !!detail && !detail.isMine;

  const title = entry ? `${entry.author.nickname}님의 ${entry.round}회독 기록` : '완독자 기록';

  const renderBody = () => {
    if (error) return <Text style={styles.muted}>{error.message || '기록을 불러오지 못했어요.'}</Text>;
    if (!detail) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
    const days = detail.sentenceCollection?.days ?? [];
    return (
      <>
        <Text style={styles.meta}>{`${formatDate(detail.completedAt)} 완독`}</Text>
        {detail.sentenceCollection && days.length > 0 ? (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>
              {`문장 모음 · ${detail.sentenceCollection.readingPeriodDays}일 동안 ${detail.sentenceCollection.recordedDayCount}일 기록`}
            </Text>
            {days.map(day => (
              <View key={day.readDate} style={styles.day}>
                <Text style={styles.dayLabel}>{`${day.dayNumber}일차 · ${formatDate(day.readDate)}`}</Text>
                {day.sentences.map(sentence => (
                  <View key={sentence.sentenceId} style={styles.sentenceRow}>
                    <View style={styles.flex}>
                      <Text style={styles.quote}>{`“${sentence.content}”`}</Text>
                      {sentence.pageNumber ? <Text style={styles.meta}>{`${sentence.pageNumber}쪽`}</Text> : null}
                    </View>
                    {canReport ? (
                      <ReportLink label="문장 신고" onPress={() => setReportTarget({ kind: 'sentence', sentenceId: sentence.sentenceId })} />
                    ) : null}
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}
        {detail.bookReport ? (
          <View style={styles.block}>
            <View style={styles.blockHeader}>
              <Text style={styles.blockTitle}>독후감</Text>
              {canReport ? (
                <ReportLink
                  label="독후감 신고"
                  onPress={() => setReportTarget({ kind: 'bookReport', bookReportId: detail.bookReport!.bookReportId })}
                />
              ) : null}
            </View>
            <Text style={styles.body}>{detail.bookReport.content}</Text>
          </View>
        ) : null}
        {days.length === 0 && !detail.bookReport ? <Text style={styles.muted}>볼 수 있는 기록이 없어요.</Text> : null}
      </>
    );
  };

  return (
    <BottomSheetModal visible={!!entry} title={title} onClose={onClose}>
      <ScrollView style={{ maxHeight: height * 0.6 }} contentContainerStyle={styles.content}>
        {renderBody()}
      </ScrollView>
      <ReviewReportSheet
        visible={!!reportTarget}
        targetLabel={reportTarget?.kind === 'bookReport' ? '독후감' : '문장'}
        onClose={() => setReportTarget(null)}
        onSubmit={request => (reportTarget ? onReport(reportTarget, request) : Promise.resolve(false))}
      />
    </BottomSheetModal>
  );
}

function ReportLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={HIT_SLOP} onPress={onPress}>
      <Text style={styles.reportLink}>신고</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: spacing.md, paddingBottom: spacing.sm },
  center: { alignItems: 'center', paddingVertical: spacing.lg },
  muted: { fontSize: 14, color: colors.secondaryText, ...keepAllWords },
  meta: { fontSize: 12, color: colors.secondaryText },
  block: { gap: spacing.sm, padding: spacing.sm + 4, borderRadius: radius.input, backgroundColor: colors.surface },
  blockHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  blockTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  day: { gap: spacing.xs },
  dayLabel: { fontSize: 12, fontWeight: '700', color: colors.primary },
  sentenceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  quote: { fontFamily: serifFont, fontSize: 15, lineHeight: 23, color: colors.text, ...keepAllWords },
  body: { fontSize: 15, lineHeight: 24, color: colors.text, ...keepAllWords },
  reportLink: { fontSize: 12, fontWeight: '600', color: colors.secondaryText },
});
