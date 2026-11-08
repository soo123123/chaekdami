import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';
import { Icon } from '../common/Icon';

/** 평점은 외부 API가 제공하는 경우에만 표시한다. */
export function RatingText({ rating, reviewCount, size = 14 }: { rating?: number; reviewCount?: number; size?: number }) {
  if (rating === undefined) return null;
  return (
    <View style={styles.row} accessibilityLabel={`평점 ${rating.toFixed(1)}`}>
      <Icon name="star" size={size + 3} color={colors.star} />
      <Text style={[styles.text, { fontSize: size }]}>
        {rating.toFixed(1)}
        {reviewCount !== undefined ? ` (${reviewCount.toLocaleString()})` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  text: { color: colors.secondaryText },
});
