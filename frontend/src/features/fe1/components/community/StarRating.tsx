import { Pressable, StyleSheet, View } from 'react-native';
import { colors, HIT_SLOP } from '../../constants/theme';
import { Icon } from '../common/Icon';

const STARS = [1, 2, 3, 4, 5] as const;

/** 별점 표시 (읽기 전용) */
export function StarRating({ value, size = 16, gap = 2 }: { value: number; size?: number; gap?: number }) {
  return (
    <View style={[styles.row, { gap }]} accessibilityLabel={`별점 ${value}점`}>
      {STARS.map(star => (
        <Icon key={star} name={star <= value ? 'star' : 'starOutline'} size={size} color={star <= value ? colors.primary : colors.borderStrong} />
      ))}
    </View>
  );
}

/** 별점 입력 (1~5) */
export function StarRatingInput({ value, onChange, size = 30, disabled = false }: { value: number; onChange: (value: number) => void; size?: number; disabled?: boolean }) {
  return (
    <View style={[styles.row, { gap: 4 }]} accessibilityRole="adjustable" accessibilityLabel="별점 선택" accessibilityValue={{ min: 0, max: 5, now: value }}>
      {STARS.map(star => (
        <Pressable
          key={star}
          accessibilityRole="button"
          accessibilityLabel={`${star}점`}
          accessibilityState={{ selected: star <= value, disabled }}
          disabled={disabled}
          hitSlop={HIT_SLOP}
          onPress={() => onChange(star)}
        >
          <Icon name={star <= value ? 'star' : 'starOutline'} size={size} color={star <= value ? colors.star : colors.borderStrong} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
