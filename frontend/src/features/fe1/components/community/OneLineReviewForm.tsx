import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, HIT_SLOP, noWebOutline, radius, spacing } from '../../constants/theme';
import { ONE_LINE_MAX_LENGTH } from '../../hooks/community/useMyReview';
import { AppButton } from '../common/AppButton';
import { CatBooksDecor } from '../common/Decor';
import { Icon } from '../common/Icon';
import { InlineError } from '../common/StateView';
import { StarRatingInput } from './StarRating';

type Props = {
  isEditing: boolean;
  rating: number;
  onRatingChange: (value: number) => void;
  oneLine: string;
  onOneLineChange: (text: string) => void;
  isSpoiler: boolean;
  onSpoilerChange: (value: boolean) => void;
  isSaving: boolean;
  error: string | null;
  onSubmit: () => void;
  onCancel?: () => void;
};

/** 한줄평 작성/수정 폼: 별점(필수) + 한 문장(선택, 100자) + 스포일러 여부 */
export function OneLineReviewForm({
  isEditing, rating, onRatingChange, oneLine, onOneLineChange, isSpoiler, onSpoilerChange, isSaving, error, onSubmit, onCancel,
}: Props) {
  const hasText = oneLine.trim().length > 0;
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <CatBooksDecor width={84} style={styles.decor} />
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>{isEditing ? '한줄평 수정하기' : '한줄평 작성하기'}</Text>
          <Text style={styles.subtitle}>이 책을 읽고 느낀 점을 한 문장으로 남겨보세요.</Text>
          <StarRatingInput value={rating} onChange={onRatingChange} size={28} disabled={isSaving} />
        </View>
      </View>

      <View style={styles.inputBox}>
        <TextInput
          value={oneLine}
          onChangeText={onOneLineChange}
          placeholder="이 책에 대한 나의 생각을 한 문장으로 적어보세요."
          placeholderTextColor={colors.tertiaryText}
          maxLength={ONE_LINE_MAX_LENGTH}
          multiline
          blurOnSubmit
          returnKeyType="done"
          editable={!isSaving}
          style={styles.input}
          accessibilityLabel="한줄평 입력"
        />
        <View style={styles.inputFooter}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSpoiler, disabled: !hasText }}
            disabled={!hasText || isSaving}
            hitSlop={HIT_SLOP}
            onPress={() => onSpoilerChange(!isSpoiler)}
            style={[styles.spoiler, !hasText && styles.dimmed]}
          >
            <Icon name={isSpoiler && hasText ? 'checkboxOn' : 'checkboxOff'} size={18} color={isSpoiler && hasText ? colors.primary : colors.tertiaryText} />
            <Text style={styles.spoilerLabel}>스포일러 포함</Text>
          </Pressable>
          <Text style={styles.counter}>{oneLine.length}/{ONE_LINE_MAX_LENGTH}</Text>
        </View>
      </View>

      <InlineError message={error} />

      <View style={styles.actions}>
        {isEditing && onCancel ? (
          <View style={styles.flex}>
            <AppButton size="md" variant="secondary" disabled={isSaving} onPress={onCancel}>취소</AppButton>
          </View>
        ) : null}
        <View style={styles.flex}>
          <AppButton size="md" isLoading={isSaving} disabled={rating < 1} onPress={onSubmit}>
            {isEditing ? '수정하기' : '등록하기'}
          </AppButton>
        </View>
      </View>
      {rating < 1 ? <Text style={styles.hint}>별점을 선택하면 등록할 수 있어요. 한줄평 없이 별점만 남길 수도 있어요.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm + 2, padding: spacing.md, borderRadius: radius.card, backgroundColor: '#FBF1E4', borderWidth: 1, borderColor: '#F0DFC8' },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  decor: { position: 'relative', marginLeft: -spacing.xs },
  heading: { flex: 1, gap: spacing.xs },
  title: { fontSize: 17, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.secondaryText, lineHeight: 18 },
  inputBox: { borderRadius: radius.input, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.sm + 4, paddingTop: spacing.sm, paddingBottom: spacing.sm, gap: spacing.xs },
  input: { minHeight: 44, fontSize: 15, lineHeight: 21, color: colors.text, textAlignVertical: 'top', ...noWebOutline },
  inputFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  spoiler: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dimmed: { opacity: 0.5 },
  spoilerLabel: { fontSize: 13, color: colors.secondaryText },
  counter: { fontSize: 13, color: colors.tertiaryText },
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  hint: { fontSize: 12, color: colors.secondaryText, textAlign: 'center' },
});
