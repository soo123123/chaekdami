import { Image, StyleSheet, Text, View } from 'react-native';
import type { CompleteLevel, CompleteRewardState, CompleteStreak } from '../../types/readingComplete';
import { cardStyle, COMPLETE_COLORS, COMPLETE_IMAGES } from './theme';

type Props = { streak: CompleteStreak; level: CompleteLevel; rewardState?: CompleteRewardState };

/**
 * D-day(연속 독서) | 레벨·경험치
 * - 보상을 받는 중이거나 실패하면 숫자 대신 '-'를 보여준다 (안내·다시 시도는 RewardStateNotice)
 * - 이미 받은 세션(alreadyGranted)은 같은 숫자를 보여주되 '+N' 획득 강조를 생략한다
 */
export function StreakLevelCard({ streak, level, rewardState = 'none' }: Props) {
  const pending = rewardState === 'loading' || rewardState === 'error';
  const highlight = rewardState === 'granted' || rewardState === 'none';
  const ratio = !pending && level.requiredExp > 0 ? Math.min(level.currentExp / level.requiredExp, 1) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.column}>
        <View style={styles.row}>
          <Image source={COMPLETE_IMAGES.flame} style={styles.icon} resizeMode="contain" />
          <View>
            <Text style={styles.label}>D-day</Text>
            <View style={styles.valueRow}>
              <Text style={styles.value}>{pending ? '-' : `${streak.days}일`}</Text>
              {!pending && highlight && streak.delta > 0 ? <Text style={styles.pill}>+{streak.delta}일</Text> : null}
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
              <Text style={styles.value}>{pending ? 'Lv. -' : `Lv. ${level.level}`}</Text>
              {!pending && highlight && level.gainedExp > 0 ? <Text style={styles.pill}>+{level.gainedExp} exp</Text> : null}
              {!pending && level.leveledUp ? <Text style={styles.levelUp}>레벨 업!</Text> : null}
            </View>
          </View>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
        </View>
        <Text style={styles.expText}>
          {pending ? '- / - exp' : `${level.currentExp.toLocaleString()} / ${level.requiredExp.toLocaleString()} exp`}
        </Text>
        {!pending && rewardState === 'alreadyGranted' && level.gainedExp > 0 ? (
          <Text style={styles.note}>이번 독서로 {level.gainedExp} exp를 받았어요</Text>
        ) : null}
        {!pending && level.boosted ? <Text style={styles.note}>EXP 부스터가 적용됐어요</Text> : null}
        {!pending && level.photoBonusExp > 0 ? (
          <Text style={styles.note}>사진 인증 보너스 +{level.photoBonusExp} exp</Text>
        ) : null}
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
  note: { fontSize: 11, color: COMPLETE_COLORS.green },
  levelUp: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    backgroundColor: COMPLETE_COLORS.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
});
