import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/common/Icon';
import type { CompleteReviewState } from '../../types/readingComplete';
import { COMPLETE_COLORS } from './theme';

type Props = {
  review: CompleteReviewState;
  round: number | null;
  onWrite: () => void;
  onOpen: () => void;
};

/**
 * 독후감 작성 버튼 (설계서 WriteReviewButton).
 * - 완독 + 독후감 없음: 작성하기
 * - 완독 + 독후감 있음: 내 독후감 보기
 * - 완독 전: 비활성 (남은 페이지 안내)
 */
export function WriteReviewButton({ review, round, onWrite, onOpen }: Props) {
  const roundLabel = round !== null && round > 1 ? `${round}회독 ` : '';

  if (!review.canWrite) {
    return (
      <View style={[styles.card, styles.disabled]} accessibilityState={{ disabled: true }}>
        <View style={[styles.iconBox, styles.iconBoxDisabled]}>
          <Icon name="pencil" size={20} color={COMPLETE_COLORS.secondary} />
        </View>
        <View style={styles.textBox}>
          <Text style={[styles.title, styles.titleDisabled]}>독후감 작성하기</Text>
          <Text style={styles.description}>
            완독하면 독후감을 쓸 수 있어요
            {review.remainingPages !== null && review.remainingPages > 0 ? ` · 남은 ${review.remainingPages}페이지` : ''}
          </Text>
        </View>
      </View>
    );
  }

  const title = review.hasReport ? `${roundLabel}내 독후감 보기` : `${roundLabel}독후감 작성하기`;
  const description = review.hasReport ? '이번 회독에 쓴 독후감을 확인해보세요.' : '완독한 책의 감상을 남겨보세요.';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={review.hasReport ? onOpen : onWrite}
      style={({ pressed }) => [styles.card, styles.enabled, pressed && styles.pressed]}
    >
      <View style={styles.iconBox}>
        <Icon name="pencil" size={20} color="#FFFFFF" />
      </View>
      <View style={styles.textBox}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Icon name="chevronRight" size={20} color={COMPLETE_COLORS.green} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  enabled: { backgroundColor: COMPLETE_COLORS.paleGreen, borderColor: '#D3DECF' },
  disabled: { backgroundColor: '#F3F1ED', borderColor: COMPLETE_COLORS.border },
  pressed: { opacity: 0.85 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COMPLETE_COLORS.green,
  },
  iconBoxDisabled: { backgroundColor: '#E4E1DB' },
  textBox: { flex: 1, gap: 3 },
  title: { fontSize: 15, fontWeight: '800', color: COMPLETE_COLORS.green },
  titleDisabled: { color: COMPLETE_COLORS.secondary },
  description: { fontSize: 12, color: COMPLETE_COLORS.secondary },
});
