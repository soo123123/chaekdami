import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, keepAllWords, radius, spacing } from '../../constants/theme';
import { formatDuration } from '../../utils/format';
import { validatePageRange } from '../../utils/validation';
import { BottomSheetModal } from '../common/BottomSheetModal';
import { AppButton } from '../common/AppButton';
import { Icon, type IconName } from '../common/Icon';
import { InlineError } from '../common/StateView';
import { PageInput } from './PageInput';

/* ------------------------------------------------------------------ */
/* ReadingTime — 독서 시간 표시 및 수정                                 */
/* ------------------------------------------------------------------ */

type ReadingTimeProps = { duration: number; onChange: (seconds: number) => void };

export function ReadingTime({ duration, onChange }: ReadingTimeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const open = () => {
    setHours(String(Math.floor(duration / 3600)));
    setMinutes(String(Math.floor((duration % 3600) / 60)));
    setError(null);
    setIsOpen(true);
  };

  const confirm = () => {
    const h = Number(hours || '0');
    const m = Number(minutes || '0');
    if (m > 59) return setError('분은 0~59 사이로 입력해주세요.');
    if (h === 0 && m === 0) return setError('독서 시간은 1분 이상이어야 해요.');
    // 수정 시 초 단위는 버리고 분 단위로 저장한다.
    onChange(h * 3600 + m * 60);
    setIsOpen(false);
  };

  return (
    <FieldCell icon="alarm" label="독서 시간" onEdit={open} editLabel="독서 시간 수정">
      <Text style={styles.value}>{formatDuration(duration)}</Text>
      <BottomSheetModal visible={isOpen} title="독서 시간 수정" onClose={() => setIsOpen(false)}>
        <View style={styles.modalRow}>
          <PageInput value={hours} onChange={setHours} suffix="시간" label="시간" />
          <PageInput value={minutes} onChange={setMinutes} suffix="분" label="분" />
        </View>
        <InlineError message={error} />
        <AppButton size="md" onPress={confirm}>확인</AppButton>
      </BottomSheetModal>
    </FieldCell>
  );
}

/* ------------------------------------------------------------------ */
/* ReadingPageRange — 읽은 페이지 범위 표시 및 수정                      */
/* ------------------------------------------------------------------ */

type ReadingPageRangeProps = {
  startPage: number;
  endPage: number;
  totalPages?: number;
  onChange: (range: { startPage: number; endPage: number }) => void;
};

export function ReadingPageRange({ startPage, endPage, totalPages, onChange }: ReadingPageRangeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState<string | null>(null);

  const open = () => {
    setStart(String(startPage));
    setEnd(String(endPage));
    setError(null);
    setIsOpen(true);
  };

  const confirm = () => {
    const s = Number(start || '0');
    const e = Number(end || '0');
    const message = validatePageRange(s, e, totalPages);
    if (message) return setError(message);
    onChange({ startPage: s, endPage: e });
    setIsOpen(false);
  };

  return (
    <FieldCell icon="bookOpenOutline" label="읽은 페이지" onEdit={open} editLabel="읽은 페이지 수정">
      <Text style={styles.value}>{`${startPage} 페이지 ~ ${endPage} 페이지`}</Text>
      {totalPages ? <Text style={styles.caption}>{`전체 ${totalPages}페이지 중`}</Text> : null}
      <BottomSheetModal visible={isOpen} title="읽은 페이지 수정" onClose={() => setIsOpen(false)}>
        <View style={styles.modalRow}>
          <PageInput value={start} onChange={setStart} suffix="쪽부터" label="시작 페이지" />
          <PageInput value={end} onChange={setEnd} suffix="쪽까지" label="종료 페이지" />
        </View>
        {totalPages ? <Text style={styles.caption}>{`전체 ${totalPages}페이지`}</Text> : null}
        <InlineError message={error} />
        <AppButton size="md" onPress={confirm}>확인</AppButton>
      </BottomSheetModal>
    </FieldCell>
  );
}

/* ------------------------------------------------------------------ */

type FieldCellProps = { icon: IconName; label: string; editLabel: string; onEdit: () => void; children: ReactNode };

/** 아이콘 · 라벨 · 값 · 수정 버튼으로 이루어진 기록 칸 */
function FieldCell({ icon, label, editLabel, onEdit, children }: FieldCellProps) {
  return (
    <View style={styles.cell}>
      <View style={styles.cellHead}>
        <Icon name={icon} size={22} color={colors.text} />
        <Text style={styles.cellLabel}>{label}</Text>
        <EditButton label={editLabel} onPress={onEdit} />
      </View>
      {children}
    </View>
  );
}

function EditButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.edit}>
      <Text style={styles.editLabel}>수정</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: { flex: 1, gap: spacing.sm, paddingVertical: spacing.sm + 6, paddingHorizontal: spacing.sm + 6 },
  cellHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cellLabel: { flex: 1, fontSize: 13, color: colors.secondaryText, ...keepAllWords },
  value: { fontSize: 17, fontWeight: '800', color: colors.text, ...keepAllWords },
  caption: { fontSize: 12, color: colors.secondaryText },
  edit: { minHeight: 32, paddingHorizontal: spacing.sm + 2, borderRadius: radius.input, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface, justifyContent: 'center' },
  editLabel: { fontSize: 13, color: colors.text },
  modalRow: { flexDirection: 'row', gap: spacing.sm },
});
