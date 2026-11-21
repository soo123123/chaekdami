import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import { useRoundReports, type RoundReportState } from '../../hooks/book/useRoundReports';
import type { ReadingRound } from '../../types/reading';
import { formatDate } from '../../utils/format';
import { BottomSheetModal } from '../common/BottomSheetModal';
import { Icon } from '../common/Icon';

type Props = {
  visible: boolean;
  rounds: ReadingRound[];
  onClose: () => void;
  /** 독후감이 있으면 상세, 없으면 작성으로 이동 */
  onSelect: (round: ReadingRound, hasReport: boolean) => void;
};

/** 책 상세 독후감 '모두 보기': 회차별 독후감 목록 (최신 회차가 위) */
export function BookReportListSheet({ visible, rounds, onClose, onSelect }: Props) {
  const { states, retry } = useRoundReports(rounds, visible);

  return (
    <BottomSheetModal visible={visible} title="독후감 모두 보기" onClose={onClose}>
      <View>
        {rounds.map(round => (
          <RoundRow
            key={round.readingRecordId}
            round={round}
            state={states[round.readingRecordId]}
            onSelect={onSelect}
            onRetry={() => retry(round.readingRecordId)}
          />
        ))}
      </View>
    </BottomSheetModal>
  );
}

function RoundRow({ round, state, onSelect, onRetry }: {
  round: ReadingRound;
  state: RoundReportState | undefined;
  onSelect: Props['onSelect'];
  onRetry: () => void;
}) {
  const isCompleted = round.status === 'COMPLETED';
  const label = isCompleted
    ? `${round.round}회독 · ${round.completedAt ? `${formatDate(round.completedAt)} 완독` : '완독'}`
    : `${round.round}회독 · ${round.status === 'NOT_STARTED' ? '읽기 전' : '읽는 중'}`;

  // 읽는 중: 완독 후에 쓸 수 있다
  if (!isCompleted) {
    return (
      <View style={styles.row} accessibilityState={{ disabled: true }}>
        <Text style={[styles.label, styles.labelDisabled]}>{label}</Text>
        <Text style={styles.disabledAction}>완독 후 작성</Text>
      </View>
    );
  }

  if (!state || state.status === 'loading') {
    return (
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={`${round.round}회독 독후감 다시 불러오기`} onPress={onRetry} style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.errorAction}>다시 시도</Text>
      </Pressable>
    );
  }

  // 서버가 완독 회차가 아니라고 하면(기록이 바뀐 경우) 작성은 막는다
  if (!state.hasReport && !state.canWrite) {
    return (
      <View style={styles.row} accessibilityState={{ disabled: true }}>
        <Text style={[styles.label, styles.labelDisabled]}>{label}</Text>
        <Text style={styles.disabledAction}>작성할 수 없어요</Text>
      </View>
    );
  }

  const action = state.hasReport ? '독후감 보기' : '작성하기';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${round.round}회독 ${action}`}
      onPress={() => onSelect(round, state.hasReport)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.actionWrap}>
        <Text style={styles.action}>{action}</Text>
        <Icon name="chevronRight" size={16} color={colors.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 54,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: { opacity: 0.7 },
  label: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  labelDisabled: { color: colors.secondaryText },
  actionWrap: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  action: { fontSize: 14, fontWeight: '700', color: colors.primary },
  disabledAction: { fontSize: 13, color: colors.tertiaryText },
  errorAction: { fontSize: 14, fontWeight: '600', color: colors.danger },
});
