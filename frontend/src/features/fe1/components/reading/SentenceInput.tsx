import { StyleSheet, Text, TextInput, View } from 'react-native';
import { MAX_SENTENCE_LENGTH } from '../../constants/options';
import { colors, radius, spacing } from '../../constants/theme';

type SentenceInputProps = { value: string; onChange: (value: string) => void };

/**
 * 인상 깊었던 문장 입력 (선택 항목).
 * 검증 규칙(설계 문서 '검증로직 포함 논의할 것'): 현재는 최대 길이만 제한하고 앞뒤 공백은 저장 시 제거한다.
 */
export function SentenceInput({ value, onChange }: SentenceInputProps) {
  return (
    <View style={styles.box}>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline
        maxLength={MAX_SENTENCE_LENGTH}
        placeholder={'예) “작은 변화가 만드는 놀라운 인생의 차이.”\n이 문장이 오늘의 저에게 가장 인상 깊었습니다.'}
        placeholderTextColor={colors.tertiaryText}
        style={styles.input}
        textAlignVertical="top"
        accessibilityLabel="인상 깊었던 문장"
      />
      <Text style={styles.counter}>{`${value.length} / ${MAX_SENTENCE_LENGTH}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, backgroundColor: colors.background, padding: spacing.md, gap: spacing.xs },
  input: { minHeight: 96, fontSize: 15, lineHeight: 22, color: colors.text, padding: 0 },
  counter: { alignSelf: 'flex-end', fontSize: 12, color: colors.tertiaryText },
});
