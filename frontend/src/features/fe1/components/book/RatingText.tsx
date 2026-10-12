import { StyleSheet, Text } from 'react-native';
import { colors } from '../../constants/theme';

/** 평점은 외부 API가 제공하는 경우에만 표시한다. */
export function RatingText({ rating, reviewCount, size = 14 }: { rating?: number; reviewCount?: number; size?: number }) {
  if (rating === undefined) return null;
  return (
    <Text style={[styles.text, { fontSize: size }]} accessibilityLabel={`평점 ${rating.toFixed(1)}`}>
      <Text style={styles.star}>★ </Text>
      {rating.toFixed(1)}
      {reviewCount !== undefined ? ` (${reviewCount.toLocaleString()})` : ''}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { color: colors.secondaryText },
  star: { color: colors.star },
});
