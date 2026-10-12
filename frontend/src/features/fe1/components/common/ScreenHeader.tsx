import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, HIT_SLOP, spacing } from '../../constants/theme';

type ScreenHeaderProps = {
  title?: string;
  /** 뒤로가기 동작은 각 Screen에서 router.back()으로 전달한다. */
  onBack?: () => void;
  right?: ReactNode;
  align?: 'left' | 'center';
};

export function ScreenHeader({ title, onBack, right, align = 'left' }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel="뒤로 가기" hitSlop={HIT_SLOP} onPress={onBack} style={styles.back}>
            <Text style={styles.backGlyph}>‹</Text>
          </Pressable>
        ) : null}
      </View>
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        style={[styles.title, align === 'center' ? styles.center : styles.left]}
      >
        {title}
      </Text>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: spacing.md, gap: spacing.sm },
  side: { minWidth: 32, justifyContent: 'center' },
  right: { alignItems: 'flex-end', minWidth: 32 },
  back: { width: 32, height: 40, justifyContent: 'center' },
  backGlyph: { fontSize: 34, lineHeight: 38, color: colors.text, fontWeight: '300' },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.text },
  left: { textAlign: 'left' },
  center: { textAlign: 'center' },
});
