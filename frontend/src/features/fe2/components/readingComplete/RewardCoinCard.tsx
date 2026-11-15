import { Image, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { COMPLETE_COLORS, COMPLETE_IMAGES } from './theme';

type Props = { coin: number };

/** 오늘의 보상 (완료한 퀘스트 보상 코인 합계) */
export function RewardCoinCard({ coin }: Props) {
  return (
    <View style={styles.card}>
      <Image source={COMPLETE_IMAGES.coin} style={styles.coin} resizeMode="contain" />
      <View style={styles.textBox}>
        <Text style={styles.caption}>오늘의 보상</Text>
        <Text style={styles.label}>독서 코인</Text>
        <Text style={styles.value}>+{coin.toLocaleString()}</Text>
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
