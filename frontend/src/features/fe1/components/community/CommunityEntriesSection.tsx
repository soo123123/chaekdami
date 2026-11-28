import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, keepAllWords, radius, serifFont, softShadow, spacing } from '../../constants/theme';
import type { CommunityEntry, CommunitySummary } from '../../types/community';
import type { AppError } from '../../utils/apiError';
import { formatDate } from '../../utils/format';
import { AppButton } from '../common/AppButton';
import { Icon } from '../common/Icon';
import { InitialAvatar } from './InitialAvatar';

type Props = {
  summary: CommunitySummary | null;
  entries: CommunityEntry[];
  hasNext: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: AppError | null;
  onRetry: () => void;
  onLoadMore: () => void;
  onOpen: (entry: CommunityEntry) => void;
};

/**
 * 완독자 기록: 같은 책을 완독한 독자들이 공개한 문장 모음집·독후감 미리보기 (TODO-13).
 * 누르면 상세 시트에서 전체 문장과 독후감을 보고 신고할 수 있다.
 */
export function CommunityEntriesSection({ summary, entries, hasNext, isLoading, isLoadingMore, error, onRetry, onLoadMore, onOpen }: Props) {
  const renderBody = () => {
    if (isLoading && entries.length === 0) {
      return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
    }
    if (error) {
      return (
        <View style={styles.center}>
          <Text style={styles.muted}>완독자 기록을 불러오지 못했어요.</Text>
          <AppButton size="md" variant="secondary" onPress={onRetry}>다시 불러오기</AppButton>
        </View>
      );
    }
    if (summary && !summary.available) {
      return <Text style={styles.muted}>직접 등록한 책은 커뮤니티를 이용할 수 없어요.</Text>;
    }
    if (summary && !summary.unlocked) {
      return <Text style={styles.muted}>완독하면 다른 독자들의 기록을 볼 수 있어요.</Text>;
    }
    if (entries.length === 0) {
      return <Text style={styles.muted}>{'아직 공개된 기록이 없어요.\n책 상세의 독서 설정에서 내 문장 모음을 공개할 수 있어요.'}</Text>;
    }
    return (
      <View style={styles.list}>
        {entries.map(entry => <EntryCard key={entry.readingRecordId} entry={entry} onPress={() => onOpen(entry)} />)}
        {hasNext ? (
          <AppButton size="md" variant="secondary" isLoading={isLoadingMore} onPress={onLoadMore}>기록 더 보기</AppButton>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>완독자 기록</Text>
        {summary ? (
          <Text style={styles.counts}>
            {`완독자 ${summary.completerCount}명 · 문장 모음 ${summary.publicCollectionCount} · 독후감 ${summary.publicBookReportCount}`}
          </Text>
        ) : null}
      </View>
      {renderBody()}
    </View>
  );
}

function EntryCard({ entry, onPress }: { entry: CommunityEntry; onPress: () => void }) {
  const sentences = entry.sentenceCollection?.previewSentences ?? [];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${entry.author.nickname}님의 ${entry.round}회독 기록 보기`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.cardHeader}>
        <InitialAvatar userId={entry.author.userId} nickname={entry.author.nickname} size={36} />
        <View style={styles.flex}>
          <Text style={styles.nickname} numberOfLines={1}>{entry.isMine ? `${entry.author.nickname} (나)` : entry.author.nickname}</Text>
          <Text style={styles.meta}>{`${entry.round}회독 · ${formatDate(entry.completedAt)} 완독`}</Text>
        </View>
        <Icon name="chevronRight" size={18} color={colors.secondaryText} />
      </View>
      {sentences.slice(0, 2).map(sentence => (
        <Text key={sentence.sentenceId} style={styles.quote} numberOfLines={2}>{`“${sentence.content}”`}</Text>
      ))}
      {entry.bookReport ? (
        <Text style={styles.report} numberOfLines={2}>{`독후감 · ${entry.bookReport.preview}`}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: { gap: spacing.sm + 4, padding: spacing.md, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(236, 227, 216, 0.6)', ...softShadow },
  header: { gap: 2 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  counts: { fontSize: 12, color: colors.secondaryText },
  center: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  muted: { fontSize: 14, lineHeight: 20, color: colors.secondaryText, ...keepAllWords },
  list: { gap: spacing.sm },
  card: { gap: spacing.sm, padding: spacing.sm + 4, borderRadius: radius.input, backgroundColor: colors.background },
  pressed: { opacity: 0.7 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  nickname: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.secondaryText },
  quote: { fontFamily: serifFont, fontSize: 14, lineHeight: 21, color: colors.text, ...keepAllWords },
  report: { fontSize: 13, lineHeight: 19, color: colors.secondaryText, ...keepAllWords },
});
