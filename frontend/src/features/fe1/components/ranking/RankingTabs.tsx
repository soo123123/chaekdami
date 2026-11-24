import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import type { RankingType } from '../../types/ranking';
import { RANKING_IMAGES } from './rankingImages';

const TABS: { value: RankingType; label: string }[] = [
  { value: 'readingTime', label: '독서 시간' },
  { value: 'experience', label: '경험치' },
];

type Props = { selected: RankingType; onChange: (type: RankingType) => void };

/** 랭킹 종류 전환 탭 */
export function RankingTabs({ selected, onChange }: Props) {
  return (
    <View style={styles.row} accessibilityRole="tablist" accessibilityLabel="랭킹 종류">
      {TABS.map(tab => {
        const isSelected = tab.value === selected;
        return (
          <Pressable
            key={tab.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(tab.value)}
            style={[styles.tab, isSelected && styles.tabSelected]}
          >
            <Image source={RANKING_IMAGES[tab.value]} style={styles.icon} contentFit="contain" accessible={false} />
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  tab: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  tabSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primaryLight },
  icon: { width: 26, height: 26 },
  label: { fontSize: 15, fontWeight: '500', color: colors.text },
  labelSelected: { fontWeight: '700', color: colors.onPrimary },
});
