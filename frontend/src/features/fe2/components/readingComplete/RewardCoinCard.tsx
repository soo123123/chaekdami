import { Image, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/common/Icon';
import type { CompleteRewardState } from '../../types/readingComplete';
import { COMPLETE_COLORS, COMPLETE_IMAGES } from './theme';

type Props = { coin: number; rewardState?: CompleteRewardState };

/**
 * 오늘의 보상 (이번 독서로 받은 코인: 달성 퀘스트 + 레벨업 승급)
 * 이미 받은 세션이면 같은 숫자와 함께 '이미 받은 보상'으로 표시한다.
 */
export function RewardCoinCard({ coin, rewardState = 'none' }: Props) {
  const pending = rewardState === 'loading' || rewardState === 'error';
  return (
    <View style={styles.card}>
      <Image source={COMPLETE_IMAGES.coin} style={styles.coin} resizeMode="contain" />
      <View style={styles.textBox}>
        <Text style={styles.caption}>{rewardState === 'alreadyGranted' ? '이미 받은 보상이에요' : '오늘의 보상'}</Text>
        <Text style={styles.label}>독서 코인</Text>
        <Text style={styles.value}>{pending ? '-' : `+${coin.toLocaleString()}`}</Text>
      </View>
      <Icon name="sparkles" size={16} color={COMPLETE_COLORS.gold} style={styles.sparkle} />
      <Image source={COMPLETE_IMAGES.books} style={styles.books} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COMPLETE_COLORS.cream,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COMPLETE_COLORS.creamBorder,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  coin: { width: 72, height: 72 },
  textBox: { flex: 1, gap: 2 },
  caption: { fontSize: 12, color: COMPLETE_COLORS.brown },
  label: { fontSize: 16, fontWeight: '700', color: COMPLETE_COLORS.text },
  value: { fontSize: 30, fontWeight: '900', color: COMPLETE_COLORS.text },
  sparkle: { position: 'absolute', left: '48%', top: 20 },
  books: { width: 110, height: 80 },
});
