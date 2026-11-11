import { Image, StyleSheet, Text, View } from 'react-native';
import type { CompleteLevel, CompleteStreak } from '../../types/readingComplete';
import { cardStyle, COMPLETE_COLORS, COMPLETE_IMAGES } from './theme';

type Props = { streak: CompleteStreak; level: CompleteLevel };

/** D-day(연속 독서) | 레벨·경험치 */
export function StreakLevelCard({ streak, level }: Props) {
  const ratio = level.requiredExp > 0 ? Math.min(level.currentExp / level.requiredExp, 1) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.column}>
        <View style={styles.row}>
          <Image source={COMPLETE_IMAGES.flame} style={styles.icon} resizeMode="contain" />
          <View>
            <Text style={styles.label}>D-day</Text>
            <View style={styles.valueRow}>
              <Text style={styles.value}>{streak.days}일</Text>
              {streak.delta > 0 ? <Text style={styles.pill}>+{streak.delta}일</Text> : null}
            </View>
          </View>
        </View>
        <Text style={styles.description}>꾸준함이 쌓이고 있어요!</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.column}>
        <View style={styles.row}>
          <Image source={COMPLETE_IMAGES.sprout} style={styles.icon} resizeMode="contain" />
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.label}>레벨</Text>
            <View style={styles.valueRow}>
              <Text style={styles.value}>Lv. {level.level}</Text>
              {level.gainedExp > 0 ? <Text style={styles.pill}>+{level.gainedExp} exp</Text> : null}
            </View>
          </View>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
        </View>
        <Text style={styles.expText}>
          {level.currentExp.toLocaleString()} / {level.requiredExp.toLocaleString()} exp
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { ...cardStyle, flexDirection: 'row', paddingVertical: 18, paddingHorizontal: 14 },
  column: { flex: 1, gap: 10, justifyContent: 'center' },
  divider: { width: 1, backgroundColor: COMPLETE_COLORS.border, marginHorizontal: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 40, height: 40 },
  label: { fontSize: 13, color: COMPLETE_COLORS.secondary },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  value: { fontSize: 24, fontWeight: '800', color: COMPLETE_COLORS.text },
  pill: {
    fontSize: 11,
    fontWeight: '600',
    color: COMPLETE_COLORS.green,
    backgroundColor: COMPLETE_COLORS.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  description: { fontSize: 12, color: COMPLETE_COLORS.text },
  track: { height: 7, borderRadius: 999, backgroundColor: COMPLETE_COLORS.track, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999, backgroundColor: COMPLETE_COLORS.green },
  expText: { fontSize: 12, color: COMPLETE_COLORS.secondary },
});
