import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';
type Props = PropsWithChildren<{ scrollable?: boolean }>;
export function ScreenContainer({ children, scrollable = true }: Props) { if (!scrollable) return <View style={styles.fixed}>{children}</View>; return <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">{children}</ScrollView>; }
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.md, gap: spacing.md, flexGrow: 1 }, fixed: { flex: 1, padding: spacing.md, gap: spacing.md, backgroundColor: colors.background } });
