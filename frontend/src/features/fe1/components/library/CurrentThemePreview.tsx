import { Image } from 'expo-image';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors, radius, spacing } from '../../constants/theme';
import { themeHeroImage } from '../../constants/themeImages';
import type { LibraryTheme } from '../../types/reading';
import { Icon } from '../common/Icon';
import { ShelfIllustration } from './ShelfIllustration';

type CurrentThemePreviewProps = {
  theme: LibraryTheme;
  /** 선택한 테마가 현재 저장(적용)된 테마인지 */
  isApplied: boolean;
  /** 선택한 테마를 저장하는 중인지 */
  isSaving?: boolean;
};

const HEIGHT = 180;

export function CurrentThemePreview({ theme, isApplied, isSaving = false }: CurrentThemePreviewProps) {
  const hero = themeHeroImage(theme.themeId);
  const { wall, text } = theme.palette;
  const gradientId = `hero-fade-${theme.themeId}`;
  return (
    <View style={[styles.card, { backgroundColor: wall }]}>
      {hero ? (
        <View style={styles.imageWrap}>
          <Image source={hero} style={styles.image} contentFit="cover" contentPosition="right" transition={150} />
          {/* 왼쪽 글자 영역과 그림이 자연스럽게 이어지도록 벽 색으로 페이드 */}
          <Svg width="45%" height={HEIGHT} style={styles.fade}>
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={wall} stopOpacity={1} />
                <Stop offset="1" stopColor={wall} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height={HEIGHT} fill={`url(#${gradientId})`} />
          </Svg>
        </View>
      ) : (
        <ShelfIllustration theme={theme} height={HEIGHT} spineCount={10} />
      )}
      <View style={styles.overlay}>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>{isApplied ? '현재 테마' : '미리보기'}</Text>
        </View>
        <Text style={[styles.name, { color: text }]}>{theme.name}</Text>
        <Text style={[styles.desc, { color: text }]}>{theme.description}</Text>
        {/* 상태가 바뀌어도 카드 내용이 움직이지 않도록 버튼 자리는 항상 같은 크기로 잡아 두고, 미적용일 때만 숨긴다 */}
        <View
          style={[styles.applied, isSaving && styles.saving, !(isApplied || isSaving) && styles.hidden]}
          accessibilityElementsHidden={!(isApplied || isSaving)}
          importantForAccessibility={isApplied || isSaving ? 'auto' : 'no-hide-descendants'}
        >
          <View style={styles.appliedIcon}>
            {isSaving ? <ActivityIndicator size="small" color={colors.onPrimary} /> : <Icon name="check" size={16} color={colors.onPrimary} />}
          </View>
          <Text style={styles.appliedLabel}>{isSaving ? '적용하는 중' : '적용 중'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { height: HEIGHT, borderRadius: radius.card, overflow: 'hidden' },
  imageWrap: { position: 'absolute', top: 0, bottom: 0, right: 0, width: '68%' },
  image: { width: '100%', height: '100%' },
  fade: { position: 'absolute', left: 0, top: 0 },
  overlay: { ...StyleSheet.absoluteFill, padding: spacing.md + 2, gap: spacing.xs + 2, width: '56%', justifyContent: 'center' },
  badge: { alignSelf: 'flex-start', minWidth: 68, alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: radius.input - 4, paddingHorizontal: spacing.sm + 2, paddingVertical: 3 },
  badgeLabel: { color: colors.onPrimary, fontSize: 12, fontWeight: '600' },
  name: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  desc: { fontSize: 13, lineHeight: 19, opacity: 0.9 },
  applied: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, alignSelf: 'flex-start', minWidth: 118, height: 36, marginTop: spacing.xs, backgroundColor: colors.primaryLight, borderRadius: radius.input, paddingHorizontal: spacing.md - 2 },
  appliedIcon: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  hidden: { opacity: 0 },
  saving: { opacity: 0.85 },
  appliedLabel: { color: colors.onPrimary, fontSize: 14, fontWeight: '700' },
});
