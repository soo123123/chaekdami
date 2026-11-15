import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import type { MyReview } from '../../types/community';
import { formatRelativeTime } from '../../utils/format';
import { AppButton } from '../common/AppButton';
import { Icon } from '../common/Icon';
import { StarRating } from './StarRating';

type Props = {
  review: MyReview;
  isSaving: boolean;
  onEdit: () => void;
  onClearOneLine: () => void;
};

/** 이미 남긴 내 한줄평. 목록에서는 빼고 여기에서만 보여준다. */
export function MyReviewCard({ review, isSaving, onEdit, onClearOneLine }: Props) {
  const hasText = !!review.oneLine?.trim();
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>내 한줄평</Text>
        <Text style={styles.time}>{formatRelativeTime(review.updatedAt)}</Text>
      </View>
      <View style={styles.ratingRow}>
        <StarRating value={review.rating} size={18} />
        <Text style={styles.ratingValue}>{review.rating}</Text>
        {review.isSpoiler && hasText ? <Text style={styles.badge}>스포일러</Text> : null}
        {!review.isPublic ? <Text style={styles.badge}>비공개</Text> : null}
      </View>
      <Text style={[styles.content, !hasText && styles.empty]}>
        {hasText ? review.oneLine : '별점만 남겼어요. 한 문장을 더해 다른 독자들과 생각을 나눠보세요.'}
      </Text>
      {review.isBlinded ? (
        <View style={styles.notice}>
          <Icon name="alert" size={16} color={colors.danger} />
          <Text style={styles.noticeText}>신고가 누적되어 다른 독자에게 보이지 않아요.</Text>
        </View>
      ) : null}
      <View style={styles.footer}>
        <View style={styles.likes} accessibilityLabel={`좋아요 ${review.likeCount}개`}>
          <Icon name="heart" size={16} color={colors.danger} />
          <Text style={styles.likeCount}>{review.likeCount}</Text>
        </View>
        <View style={styles.actions}>
          {hasText ? (
            <AppButton size="md" variant="secondary" disabled={isSaving} onPress={onClearOneLine}>한줄평 지우기</AppButton>
          ) : null}
          <AppButton size="md" disabled={isSaving} onPress={onEdit}>{hasText ? '수정' : '한줄평 쓰기'}</AppButton>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.card, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryBorder },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 17, fontWeight: '800', color: colors.primary },
  time: { fontSize: 12, color: colors.secondaryText },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ratingValue: { fontSize: 15, fontWeight: '600', color: colors.text },
  badge: { fontSize: 11, fontWeight: '700', color: colors.secondaryText, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.surface, overflow: 'hidden' },
  content: { fontSize: 15, lineHeight: 22, color: colors.text },
  empty: { color: colors.secondaryText, fontSize: 14 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: spacing.sm, borderRadius: radius.input, backgroundColor: colors.dangerSoft },
  noticeText: { flex: 1, fontSize: 13, color: colors.danger },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  likes: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeCount: { fontSize: 13, color: colors.secondaryText },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
