import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import { AppButton } from './AppButton';
import { BottomSheetModal } from './BottomSheetModal';
import { InlineError } from './StateView';

type TextInputModalProps = {
  visible: boolean;
  title: string;
  description?: string;
  initialValue?: string;
  placeholder?: string;
  suffix?: string;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  /** 오류 메시지를 반환하면 저장을 막는다 */
  validate?: (value: string) => string | null;
  onConfirm: (value: string) => void;
  onClear?: () => void;
  onClose: () => void;
};

/** 숫자/텍스트 단일 값 입력 모달 (목표 페이지, ISBN 등) */
export function TextInputModal({
  visible,
  title,
  description,
  initialValue = '',
  placeholder,
  suffix,
  keyboardType = 'default',
  maxLength,
  validate,
  onConfirm,
  onClear,
  onClose,
}: TextInputModalProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
      setError(null);
    }
  }, [visible, initialValue]);

  const handleConfirm = () => {
    const message = validate?.(value) ?? null;
    if (message) {
      setError(message);
      return;
    }
    onConfirm(value);
    onClose();
  };

  return (
    <BottomSheetModal visible={visible} title={title} onClose={onClose}>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      <View style={styles.inputRow}>
        <TextInput
          autoFocus
          value={value}
          onChangeText={text => { setValue(text); setError(null); }}
          placeholder={placeholder}
          placeholderTextColor={colors.tertiaryText}
          keyboardType={keyboardType}
          maxLength={maxLength}
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={handleConfirm}
          accessibilityLabel={title}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
      <InlineError message={error} />
      <View style={styles.actions}>
        {onClear ? (
          <View style={styles.action}>
            <AppButton size="md" variant="secondary" onPress={() => { onClear(); onClose(); }}>선택 해제</AppButton>
          </View>
        ) : null}
        <View style={styles.action}>
          <AppButton size="md" onPress={handleConfirm}>확인</AppButton>
        </View>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  description: { fontSize: 14, color: colors.secondaryText },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: { flex: 1, minHeight: 52, borderRadius: radius.input, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.md, fontSize: 17, color: colors.text },
  suffix: { fontSize: 16, color: colors.secondaryText },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
