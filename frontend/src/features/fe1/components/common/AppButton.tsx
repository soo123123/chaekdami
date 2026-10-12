import type { PropsWithChildren, ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

type AppButtonProps = PropsWithChildren<{
  onPress?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'dangerOutline';
  size?: 'md' | 'lg';
  icon?: ReactNode;
  accessibilityLabel?: string;
}>;

export function AppButton({
  children,
  onPress,
  disabled = false,
  isLoading = false,
  variant = 'primary',
  size = 'lg',
  icon,
  accessibilityLabel,
}: AppButtonProps) {
  const isDisabled = disabled || isLoading;
  const labelStyle = [
    styles.label,
    size === 'md' && styles.labelMd,
    (variant === 'secondary') && styles.secondaryLabel,
    variant === 'dangerOutline' && styles.dangerLabel,
  ];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        size === 'md' && styles.buttonMd,
        styles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? colors.onPrimary : colors.primary} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text style={labelStyle}>{children}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 56, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, borderRadius: radius.button },
  buttonMd: { minHeight: 44, paddingHorizontal: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: colors.danger },
  dangerOutline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.82 },
  label: { color: colors.onPrimary, fontSize: 17, fontWeight: '700' },
  labelMd: { fontSize: 15, fontWeight: '600' },
  secondaryLabel: { color: colors.text },
  dangerLabel: { color: colors.danger },
});
