import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, noWebOutline, radius, spacing } from '../../constants/theme';
import { digitsOnly } from '../../utils/format';

type PageInputProps = {
  value: string;
  onChange: (value: string) => void;
  /** 입력칸 뒤 단위 (쪽부터, 분 등) */
  suffix: string;
  /** 스크린 리더용 이름 */
  label: string;
};

/** 숫자만 입력받는 페이지/시간 입력칸 */
export function PageInput({ value, onChange, suffix, label }: PageInputProps) {
  return (
    <View style={styles.box}>
      <TextInput
        value={value}
        onChangeText={text => onChange(digitsOnly(text))}
        keyboardType="number-pad"
        style={styles.input}
        accessibilityLabel={label}
        selectTextOnFocus
      />
      <Text style={styles.suffix}>{suffix}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  input: { flex: 1, minWidth: 0, minHeight: 52, borderRadius: radius.input, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, textAlign: 'center', fontSize: 18, color: colors.text, ...noWebOutline },
  suffix: { fontSize: 14, color: colors.secondaryText },
});
