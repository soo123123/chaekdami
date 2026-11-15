import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { REPORT_REASONS } from '../../constants/options';
import { colors, noWebOutline, radius, spacing } from '../../constants/theme';
import type { ReportReason, ReviewReportRequest } from '../../types/community';
import { AppButton } from '../common/AppButton';
import { BottomSheetModal } from '../common/BottomSheetModal';
import { Icon } from '../common/Icon';

const DETAIL_MAX_LENGTH = 300;

type Props = {
  visible: boolean;
  onClose: () => void;
  /** 성공하면 true를 돌려준다 (시트를 닫는다) */
  onSubmit: (request: ReviewReportRequest) => Promise<boolean>;
};

/** 한줄평 신고: 사유 선택 + 기타 사유 입력(300자) */
export function ReviewReportSheet({ visible, onClose, onSubmit }: Props) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setReason(null);
      setDetail('');
    }
  }, [visible]);

  const needsDetail = reason === 'OTHER';
  const canSubmit = !!reason && (!needsDetail || detail.trim().length > 0);

  const handleSubmit = async () => {
    if (!reason || !canSubmit) return;
    setIsSubmitting(true);
    const ok = await onSubmit({ reason, detail: needsDetail ? detail.trim() : undefined });
    setIsSubmitting(false);
    if (ok) onClose();
  };

  return (
    <BottomSheetModal visible={visible} title="한줄평 신고" onClose={isSubmitting ? () => undefined : onClose}>
      <Text style={styles.description}>신고가 3건 쌓이면 한줄평이 자동으로 가려져요.</Text>
      <View>
        {REPORT_REASONS.map(option => {
          const isSelected = option.value === reason;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              onPress={() => setReason(option.value)}
              style={styles.option}
            >
              <Icon name={isSelected ? 'radioOn' : 'radioOff'} size={20} color={isSelected ? colors.primary : colors.tertiaryText} />
              <Text style={[styles.optionLabel, isSelected && styles.optionSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {needsDetail ? (
        <View style={styles.inputBox}>
          <TextInput
            value={detail}
            onChangeText={text => setDetail(text.slice(0, DETAIL_MAX_LENGTH))}
            placeholder="신고 사유를 적어주세요."
            placeholderTextColor={colors.tertiaryText}
            multiline
            maxLength={DETAIL_MAX_LENGTH}
            style={styles.input}
            accessibilityLabel="기타 신고 사유"
          />
          <Text style={styles.counter}>{detail.length}/{DETAIL_MAX_LENGTH}</Text>
        </View>
      ) : null}
      <AppButton size="md" variant="danger" disabled={!canSubmit} isLoading={isSubmitting} onPress={handleSubmit}>신고하기</AppButton>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  description: { fontSize: 13, color: colors.secondaryText, marginTop: -spacing.sm },
  option: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  optionLabel: { fontSize: 15, color: colors.text },
  optionSelected: { fontWeight: '700', color: colors.primary },
  inputBox: { borderRadius: radius.input, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.sm + 4, gap: spacing.xs },
  input: { minHeight: 64, fontSize: 15, color: colors.text, textAlignVertical: 'top', ...noWebOutline },
  counter: { alignSelf: 'flex-end', fontSize: 12, color: colors.tertiaryText },
});
