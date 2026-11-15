import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, HIT_SLOP, radius, spacing } from '../../constants/theme';
import type { PublicReview } from '../../types/community';
import { formatRelativeTime } from '../../utils/format';
import { Icon } from '../common/Icon';
import { InitialAvatar } from './InitialAvatar';
import { StarRating } from './StarRating';

type Props = {
  review: PublicReview;
  onToggleLike: (review: PublicReview) => void;
  onMore: (review: PublicReview) => void;
};

/** 한줄평 모아보기 항목. 스포일러는 눌러야 본문이 보인다. */
export const ReviewListItem = memo(function ReviewListItem({ review, onToggleLike, onMore }: Props) {
  const [isRevealed, setIsRevealed] = useState(false);
  const isHidden = review.isSpoiler && !isRevealed;
  return (
    <View style={styles.row}>
      <InitialAvatar userId={review.author.userId} nickname={review.author.nickname} size={52} />
      <View style={styles.body}>
        <View style={styles.ratingRow}>
          <StarRating value={review.rating} size={16} />
          <Text style={styles.ratingValue}>{review.rating}</Text>
        </View>
        {isHidden ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="스포일러가 포함된 한줄평 보기"
            onPress={() => setIsRevealed(true)}
            style={styles.spoilerBox}
          >
            <Icon name="eye" size={16} color={colors.secondaryText} />
            <Text style={styles.spoilerText}>스포일러 포함 · 눌러서 보기</Text>
          </Pressable>
        ) : (
          <Text style={styles.content}>{review.oneLine}</Text>
        )}
        <Text style={styles.meta} numberOfLines={1}>
          {review.author.nickname} · {formatRelativeTime(review.createdAt)}
        </Text>
      </View>
      <View style={styles.side}>
        <Pressable accessibilityRole="button" accessibilityLabel="더보기" hitSlop={HIT_SLOP} onPress={() => onMore(review)}>
          <Icon name="moreVertical" size={18} color={colors.secondaryText} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={review.isLiked ? '좋아요 취소' : '좋아요'}
          accessibilityState={{ selected: review.isLiked, disabled: review.isMine }}
          disabled={review.isMine}
          hitSlop={HIT_SLOP}
          onPress={() => onToggleLike(review)}
          style={styles.like}
        >
          <Icon name={review.isLiked ? 'heart' : 'heartOutline'} size={20} color={review.isLiked ? colors.danger : colors.secondaryText} />
          <Text style={styles.likeCount}>{review.likeCount}</Text>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm + 4, paddingVertical: spacing.md - 2 },
  body: { flex: 1, gap: spacing.xs + 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ratingValue: { fontSize: 14, color: colors.secondaryText },
  content: { fontSize: 15, lineHeight: 21, color: colors.text },
  spoilerBox: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.sm, borderRadius: radius.input, backgroundColor: colors.surfaceMuted },
  spoilerText: { flex: 1, fontSize: 13, color: colors.secondaryText },
  meta: { fontSize: 12, color: colors.tertiaryText },
  side: { alignItems: 'flex-end', justifyContent: 'space-between' },
  like: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  likeCount: { fontSize: 14, color: colors.secondaryText, minWidth: 18 },
});
