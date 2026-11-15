import { Image, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/common/Icon';
import type { CompleteQuest } from '../../types/readingComplete';
import { COMPLETE_COLORS, COMPLETE_IMAGES } from './theme';

type Props = { quests: CompleteQuest[] };

/** 퀘스트 달성 현황 */
export function QuestProgressCard({ quests }: Props) {
  const completedCount = quests.filter(quest => quest.completed).length;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>퀘스트 달성 현황</Text>
        <Text style={styles.count}>
          {completedCount} / {quests.length} 완료
        </Text>
      </View>
      <View style={styles.body}>
        <View style={styles.list}>
          {quests.map((quest, index) => (
            <View key={quest.id} style={[styles.item, index > 0 && styles.itemBorder]}>
              {quest.completed ? (
                <View style={styles.checkOn}>
                  <Icon name="check" size={16} color="#FFFFFF" />
                </View>
              ) : (
                <View style={styles.checkOff} />
              )}
              <View style={styles.textBox}>
                <Text style={styles.questTitle} numberOfLines={1}>
                  {quest.title}
                </Text>
                <Text style={styles.questDescription} numberOfLines={1}>
                  {quest.description}
                </Text>
              </View>
              <View style={styles.rewardBox}>
                {quest.completed ? (
                  <Image source={COMPLETE_IMAGES.coin} style={styles.coin} resizeMode="contain" />
                ) : null}
                <Text style={[styles.reward, !quest.completed && styles.rewardOff]}>+{quest.rewardCoin}</Text>
              </View>
            </View>
          ))}
        </View>
        <Image source={COMPLETE_IMAGES.questCat} style={styles.cat} resizeMode="contain" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COMPLETE_COLORS.paleGreen,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E1E8DC',
    padding: 16,
    gap: 12,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '800', color: COMPLETE_COLORS.text },
  count: { fontSize: 13, color: COMPLETE_COLORS.text },
  body: { flexDirection: 'row', alignItems: 'center' },
  list: {
    flex: 1,
    backgroundColor: COMPLETE_COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COMPLETE_COLORS.border,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 12 },
  itemBorder: { borderTopWidth: 1, borderTopColor: COMPLETE_COLORS.border },
  checkOn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COMPLETE_COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOff: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: '#D9D5CE' },
  textBox: { flex: 1, gap: 2 },
  questTitle: { fontSize: 14, fontWeight: '600', color: COMPLETE_COLORS.text },
  questDescription: { fontSize: 11, color: COMPLETE_COLORS.secondary },
  rewardBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  coin: { width: 18, height: 18 },
  reward: { fontSize: 13, color: COMPLETE_COLORS.text },
  rewardOff: { color: COMPLETE_COLORS.secondary },
  cat: { width: 96, height: 120, marginLeft: 4, marginRight: -6 },
});
