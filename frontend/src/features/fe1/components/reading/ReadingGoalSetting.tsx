import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import { digitsOnly, formatDate, todayIso } from '../../utils/format';
import { DatePickerModal } from '../common/DatePickerModal';
import { Icon, type IconName } from '../common/Icon';
import { TextInputModal } from '../common/TextInputModal';

type ReadingGoalSettingProps = {
  goalDate?: string;
  goalPage?: number;
  currentPage: number;
  totalPages?: number;
  onDateChange: (goalDate: string | undefined) => void;
  onPageChange: (goalPage: number | undefined) => void;
};

/**
 * 독서 목표(선택) — 목표 날짜/목표 페이지.
 * 검증 규칙(백엔드 확정 전 임시): 날짜는 오늘 이후, 페이지는 현재 페이지 초과 ~ 전체 페이지 이하.
 */
export function ReadingGoalSetting({ goalDate, goalPage, currentPage, totalPages, onDateChange, onPageChange }: ReadingGoalSettingProps) {
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isPageOpen, setIsPageOpen] = useState(false);

  const validatePage = (text: string) => {
    const value = Number(digitsOnly(text));
    if (!text || !value) return '목표 페이지를 입력해주세요.';
    if (value <= currentPage) return `현재 읽은 페이지(${currentPage}쪽)보다 커야 해요.`;
    if (totalPages && value > totalPages) return `전체 페이지(${totalPages}쪽)를 넘을 수 없어요.`;
    return null;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>독서 목표 (선택)</Text>
      <View style={styles.row}>
        <GoalButton
          icon="calendarGoal"
          iconColor={colors.primaryLight}
          label={goalDate ? `${formatDate(goalDate)}까지` : '목표 날짜 설정'}
          isSet={!!goalDate}
          onPress={() => setIsDateOpen(true)}
        />
        <GoalButton
          icon="flag"
          iconColor={colors.flag}
          label={goalPage ? `${goalPage}쪽까지` : '목표 페이지 설정'}
          isSet={!!goalPage}
          onPress={() => setIsPageOpen(true)}
        />
      </View>
      <DatePickerModal
        visible={isDateOpen}
        title="목표 날짜"
        value={goalDate}
        minDate={todayIso()}
        onConfirm={onDateChange}
        onClear={goalDate ? () => onDateChange(undefined) : undefined}
        onClose={() => setIsDateOpen(false)}
      />
      <TextInputModal
        visible={isPageOpen}
        title="목표 페이지"
        description={totalPages ? `전체 ${totalPages}쪽 중 목표로 할 페이지를 입력해주세요.` : '목표로 할 페이지를 입력해주세요.'}
        initialValue={goalPage ? String(goalPage) : ''}
        placeholder="예) 200"
        suffix="쪽"
        keyboardType="number-pad"
        validate={validatePage}
        onConfirm={text => onPageChange(Number(digitsOnly(text)))}
        onClear={goalPage ? () => onPageChange(undefined) : undefined}
        onClose={() => setIsPageOpen(false)}
      />
    </View>
  );
}

type GoalButtonProps = { icon: IconName; iconColor: string; label: string; isSet: boolean; onPress: () => void };

function GoalButton({ icon, iconColor, label, isSet, onPress }: GoalButtonProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.button, isSet && styles.buttonSet]}>
      <Icon name={icon} size={22} color={iconColor} />
      <Text style={[styles.label, isSet && styles.labelSet]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm + 4 },
  title: { fontSize: 19, fontWeight: '800', color: colors.text },
  row: { flexDirection: 'row', gap: spacing.sm + 4 },
  button: { flex: 1, minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.button, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.sm },
  buttonSet: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  label: { fontSize: 15, color: colors.text, flexShrink: 1 },
  labelSet: { color: colors.primary, fontWeight: '700' },
});
