import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, HIT_SLOP, spacing } from '../../constants/theme';
import { Icon } from './Icon';

type ScreenHeaderProps = {
  title?: string;
  /** 뒤로가기 동작은 각 Screen에서 router.back()으로 전달한다. */
  onBack?: () => void;
  right?: ReactNode;
  align?: 'left' | 'center';
  /** 제목 아래 보조 문구 (가운데 정렬 헤더에서 사용) */
  subtitle?: string;
};

export function ScreenHeader({ title, onBack, right, align = 'left', subtitle }: ScreenHeaderProps) {
  const isCenter = align === 'center';
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={[styles.side, isCenter && styles.sideCenter]}>
          {onBack ? (
            <Pressable accessibilityRole="button" accessibilityLabel="뒤로 가기" hitSlop={HIT_SLOP} onPress={onBack} style={styles.back}>
              <Icon name="back" size={28} />
            </Pressable>
          ) : null}
        </View>
        <Text accessibilityRole="header" numberOfLines={1} style={[styles.title, isCenter ? styles.center : styles.left]}>
          {title}
        </Text>
        <View style={[styles.side, styles.right, isCenter && styles.sideCenter]}>{right}</View>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.sm, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 52, gap: spacing.sm },
  side: { minWidth: 32, justifyContent: 'center' },
  sideCenter: { minWidth: 96 },
  right: { alignItems: 'flex-end' },
  back: { width: 36, height: 44, justifyContent: 'center', marginLeft: -6 },
  title: { flex: 1, fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  left: { textAlign: 'left' },
  center: { textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.secondaryText, textAlign: 'center' },
});
