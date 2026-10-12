import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import { digitsOnly, formatDuration } from '../../utils/format';
import { validatePageRange } from '../../utils/validation';
import { BottomSheetModal } from '../common/BottomSheetModal';
import { AppButton } from '../common/AppButton';
import { InlineError } from '../common/StateView';

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
    <View style={styles.cell}>
      <Text style={styles.cellLabel}>⏱  독서 시간</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{formatDuration(duration)}</Text>
        <EditButton label="독서 시간 수정" onPress={open} />
      </View>
      <BottomSheetModal visible={isOpen} title="독서 시간 수정" onClose={() => setIsOpen(false)}>
        <View style={styles.modalRow}>
          <NumberBox value={hours} onChange={setHours} suffix="시간" label="시간" />
          <NumberBox value={minutes} onChange={setMinutes} suffix="분" label="분" />
        </View>
        <InlineError message={error} />
        <AppButton size="md" onPress={confirm}>확인</AppButton>
      </BottomSheetModal>
    </View>
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
    <View style={styles.cell}>
      <Text style={styles.cellLabel}>📖  읽은 페이지</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>{`${startPage} ~ ${endPage} 페이지`}</Text>
        <EditButton label="읽은 페이지 수정" onPress={open} />
      </View>
      {totalPages ? <Text style={styles.caption}>{`전체 ${totalPages}페이지 중`}</Text> : null}
      <BottomSheetModal visible={isOpen} title="읽은 페이지 수정" onClose={() => setIsOpen(false)}>
        <View style={styles.modalRow}>
          <NumberBox value={start} onChange={setStart} suffix="쪽부터" label="시작 페이지" />
          <NumberBox value={end} onChange={setEnd} suffix="쪽까지" label="종료 페이지" />
        </View>
        {totalPages ? <Text style={styles.caption}>{`전체 ${totalPages}페이지`}</Text> : null}
        <InlineError message={error} />
        <AppButton size="md" onPress={confirm}>확인</AppButton>
      </BottomSheetModal>
    </View>
  );
}

/* ------------------------------------------------------------------ */

function EditButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.edit}>
      <Text style={styles.editLabel}>수정</Text>
    </Pressable>
  );
}

function NumberBox({ value, onChange, suffix, label }: { value: string; onChange: (v: string) => void; suffix: string; label: string }) {
  return (
    <View style={styles.numberBox}>
      <TextInput
        value={value}
        onChangeText={text => onChange(digitsOnly(text))}
        keyboardType="number-pad"
        style={styles.numberInput}
        accessibilityLabel={label}
        selectTextOnFocus
      />
      <Text style={styles.suffix}>{suffix}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: { flex: 1, gap: spacing.xs, padding: spacing.sm + 4 },
  cellLabel: { fontSize: 13, color: colors.secondaryText },
  valueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  value: { flexShrink: 1, fontSize: 17, fontWeight: '800', color: colors.text },
  caption: { fontSize: 12, color: colors.secondaryText },
  edit: { minHeight: 34, paddingHorizontal: spacing.sm + 2, borderRadius: radius.input, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'center' },
  editLabel: { fontSize: 13, color: colors.text },
  modalRow: { flexDirection: 'row', gap: spacing.sm },
  numberBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  numberInput: { flex: 1, minHeight: 52, borderRadius: radius.input, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, textAlign: 'center', fontSize: 18, color: colors.text },
  suffix: { fontSize: 14, color: colors.secondaryText },
});
