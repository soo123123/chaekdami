import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import { calcProgress } from '../../utils/format';

type ReadingProgressProps = {
  currentPage: number;
  totalPages?: number;
  /** 라벨/퍼센트 행 표시 여부 */
  showLabels?: boolean;
  /** 막대 아래 'n / m 페이지' 캡션 표시 여부 */
  showCaption?: boolean;
  height?: number;
};

/** 독서 진행 바. 진행률은 원본 값에서 계산한다. */
export function ReadingProgress({ currentPage, totalPages, showLabels = true, showCaption = true, height = 8 }: ReadingProgressProps) {
  const percentage = calcProgress(currentPage, totalPages);
  return (
    <View style={styles.container}>
      {showLabels ? (
        <View style={styles.labels}>
          <Text style={styles.label}>독서 진행률</Text>
          <Text style={styles.value}>{percentage === null ? '페이지 수 미정' : `${percentage}%`}</Text>
        </View>
      ) : null}
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: percentage ?? 0 }}
        style={[styles.track, { height, borderRadius: height / 2 }]}
      >
        <View style={[styles.fill, { width: `${percentage ?? 0}%`, borderRadius: height / 2 }]} />
      </View>
      {showCaption ? (
        <Text style={styles.caption}>{`${currentPage} / ${totalPages ?? '-'} 페이지`}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: colors.secondaryText, fontSize: 14 },
  value: { color: colors.text, fontSize: 15, fontWeight: '700' },
  track: { overflow: 'hidden', backgroundColor: colors.progressTrack, borderRadius: radius.pill },
  fill: { height: '100%', backgroundColor: colors.primary },
  caption: { color: colors.secondaryText, fontSize: 13 },
});
