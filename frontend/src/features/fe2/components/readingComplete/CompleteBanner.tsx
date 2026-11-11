import { Image, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { COMPLETE_COLORS, COMPLETE_IMAGES } from './theme';

/** 상단 배너: 완료 문구 + 고양이 일러스트 */
export function CompleteBanner() {
  return (
    <View style={styles.banner}>
      <Icon name="sparkles" size={16} color={COMPLETE_COLORS.gold} style={[styles.sparkle, { top: 6, left: 4 }]} />
      <Icon name="sparkles" size={11} color={COMPLETE_COLORS.gold} style={[styles.sparkle, { top: 40, left: '46%' }]} />
      <View style={styles.textBox}>
        <Text style={styles.subtitle}>오늘도 수고했어요!</Text>
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
          독서를 완료했어요!
        </Text>
        <Text style={styles.description}>꾸준한 하루가 더 나은 내일을 만들어요.</Text>
      </View>
      <Image source={COMPLETE_IMAGES.bannerCat} style={styles.cat} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', minHeight: 170, paddingTop: 12 },
  textBox: { flex: 1, gap: 6, zIndex: 1 },
  subtitle: { fontSize: 19, fontWeight: '800', color: COMPLETE_COLORS.text },
  title: { fontSize: 28, fontWeight: '900', color: COMPLETE_COLORS.title, letterSpacing: -0.5 },
  description: { fontSize: 13, color: COMPLETE_COLORS.secondary, marginTop: 4 },
  cat: { width: 140, height: 150, marginRight: -8 },
  sparkle: { position: 'absolute' },
});
