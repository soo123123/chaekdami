import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import type { AppError } from '../../utils/apiError';
import { AppButton } from './AppButton';

type LoadingProps = { message?: string };

export function LoadingView({ message = '불러오는 중이에요…' }: LoadingProps) {
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

type ErrorProps = {
  error: AppError;
  onRetry?: () => void;
  onBack?: () => void;
};

export function ErrorView({ error, onRetry, onBack }: ErrorProps) {
  const title = error.kind === 'pending' ? '아직 준비 중인 기능이에요' : '문제가 발생했어요';
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{error.message}</Text>
      <View style={styles.actions}>
        {onRetry && error.kind !== 'pending' ? (
          <AppButton size="md" onPress={onRetry}>다시 시도</AppButton>
        ) : null}
        {onBack ? (
          <AppButton size="md" variant="secondary" onPress={onBack}>이전 화면으로</AppButton>
        ) : null}
      </View>
    </View>
  );
}

type EmptyProps = { title: string; message?: string; actionLabel?: string; onAction?: () => void };

export function EmptyView({ title, message, actionLabel, onAction }: EmptyProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.actions}>
          <AppButton size="md" onPress={onAction}>{actionLabel}</AppButton>
        </View>
      ) : null}
    </View>
  );
}

/** 폼 하단 등 인라인 오류 메시지 */
export function InlineError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <Text accessibilityRole="alert" style={styles.inline}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  title: { fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center' },
  message: { fontSize: 14, color: colors.secondaryText, textAlign: 'center', lineHeight: 20 },
  actions: { marginTop: spacing.sm, gap: spacing.sm, alignSelf: 'stretch', paddingHorizontal: spacing.xl },
  inline: { color: colors.danger, fontSize: 13, lineHeight: 18 },
});
