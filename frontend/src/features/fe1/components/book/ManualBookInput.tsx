import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MAX_AUTHOR_LENGTH, MAX_PUBLISHER_LENGTH, MAX_TITLE_LENGTH } from '../../constants/options';
import { colors, noWebOutline, radius, spacing } from '../../constants/theme';
import type { ManualBookInput as ManualBook } from '../../types/reading';
import { formatDate } from '../../utils/format';
import { BookCover } from '../common/BookCover';
import { Icon, type IconName } from '../common/Icon';

type ManualBookInputProps = {
  book: ManualBook;
  onChange: (patch: Partial<ManualBook>) => void;
  onPressCover: () => void;
  onPressPublishedDate: () => void;
  onPressIsbn: () => void;
  errors?: Partial<Record<'title' | 'author' | 'publisher', string>>;
};

export function ManualBookInput({ book, onChange, onPressCover, onPressPublishedDate, onPressIsbn, errors }: ManualBookInputProps) {
  return (
    <View style={styles.container}>
      <Pressable accessibilityRole="button" accessibilityLabel="표지 추가하기" onPress={onPressCover} style={styles.cover}>
        {book.coverImageUri ? (
          <BookCover uri={book.coverImageUri} title={book.title || '표지'} width={92} height={138} />
        ) : (
          <>
            <Icon name="image" size={44} color="#C9C3BB" />
            <Text style={styles.coverLabel}>표지 추가하기</Text>
            <View style={styles.coverPlus}><Icon name="plus" size={18} color={colors.onPrimary} /></View>
          </>
        )}
      </Pressable>
      <View style={styles.fields}>
        <Field
          icon="book"
          value={book.title}
          placeholder="책 제목을 입력해주세요."
          maxLength={MAX_TITLE_LENGTH}
          onChangeText={title => onChange({ title })}
          error={errors?.title}
        />
        <Field
          icon="pencil"
          value={book.author}
          placeholder="저자를 입력해주세요."
          maxLength={MAX_AUTHOR_LENGTH}
          onChangeText={author => onChange({ author })}
          error={errors?.author}
        />
        <Field
          icon="publisher"
          value={book.publisher}
          placeholder="출판사를 입력해주세요."
          maxLength={MAX_PUBLISHER_LENGTH}
          onChangeText={publisher => onChange({ publisher })}
          error={errors?.publisher}
        />
        <View style={styles.optionalRow}>
          <OptionalButton icon="calendar" label={book.publishedDate ? formatDate(book.publishedDate) : '출판일 (선택)'} onPress={onPressPublishedDate} />
          <OptionalButton icon="barcode" label={book.isbn ? book.isbn : 'ISBN (선택)'} onPress={onPressIsbn} />
        </View>
      </View>
    </View>
  );
}

type FieldProps = {
  icon: IconName;
  value: string;
  placeholder: string;
  maxLength: number;
  onChangeText: (value: string) => void;
  error?: string;
};

function Field({ icon, value, placeholder, maxLength, onChangeText, error }: FieldProps) {
  return (
    <View>
      <View style={[styles.field, error && styles.fieldError]}>
        <Icon name={icon} size={20} color={colors.secondaryText} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.tertiaryText}
          maxLength={maxLength}
          style={styles.input}
          accessibilityLabel={placeholder}
        />
        <Text style={styles.counter}>{`${value.length}/${maxLength}`}</Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function OptionalButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.optional}>
      <Icon name={icon} size={18} color={colors.text} />
      <Text style={styles.optionalLabel} numberOfLines={1}>{label}</Text>
      <Icon name="chevronRight" size={14} color={colors.secondaryText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: spacing.sm + 2 },
  cover: { width: 92, minHeight: 170, borderRadius: radius.input, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  coverLabel: { fontSize: 13, color: colors.secondaryText },
  coverPlus: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#D6CFC6', alignItems: 'center', justifyContent: 'center' },
  fields: { flex: 1, minWidth: 0, gap: spacing.sm },
  field: { flexDirection: 'row', alignItems: 'center', minHeight: 50, borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, backgroundColor: colors.surface, paddingHorizontal: spacing.sm + 2, gap: spacing.sm },
  fieldError: { borderColor: colors.danger },
  input: { flex: 1, minWidth: 0, fontSize: 15, color: colors.text, paddingVertical: spacing.sm, ...noWebOutline },
  counter: { fontSize: 12, color: colors.tertiaryText },
  error: { fontSize: 12, color: colors.danger, marginTop: 2, marginLeft: spacing.xs },
  optionalRow: { flexDirection: 'row', gap: spacing.sm },
  optional: { flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 50, borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, backgroundColor: colors.surface, paddingHorizontal: spacing.sm, gap: spacing.xs },
  optionalLabel: { flex: 1, minWidth: 0, fontSize: 13, color: colors.text },
});
