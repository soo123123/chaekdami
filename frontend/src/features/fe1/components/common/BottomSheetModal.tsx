import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../../constants/theme';

type BottomSheetModalProps = PropsWithChildren<{
  visible: boolean;
  title: string;
  onClose: () => void;
}>;

/** 하단 시트 형태의 공용 모달 (날짜 선택, 숫자 입력, 정렬 선택 등) */
export function BottomSheetModal({ visible, title, onClose, children }: BottomSheetModalProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="닫기" />
        <View style={[styles.sheet, { paddingBottom: spacing.md + insets.bottom }]}>
          <View style={styles.handle} />
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** 플랫폼(웹 포함)과 무관하게 동작하는 확인 모달 */
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = '취소',
  destructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.center}>
        <Pressable style={StyleSheet.absoluteFill} onPress={isLoading ? undefined : onCancel} />
        <View style={styles.dialog} accessibilityRole="alert">
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.dialogActions}>
            <Pressable accessibilityRole="button" disabled={isLoading} onPress={onCancel} style={[styles.dialogButton, styles.cancel]}>
              <Text style={styles.cancelLabel}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isLoading}
              onPress={onConfirm}
              style={[styles.dialogButton, destructive ? styles.destructive : styles.confirm, isLoading && styles.loading]}
            >
              <Text style={styles.confirmLabel}>{isLoading ? '처리 중…' : confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: radius.card + 4, borderTopRightRadius: radius.card + 4, paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.md },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.overlay, padding: spacing.lg },
  dialog: { width: '100%', maxWidth: 360, backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg, gap: spacing.sm },
  message: { fontSize: 15, color: colors.secondaryText, lineHeight: 22 },
  dialogActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  dialogButton: { flex: 1, minHeight: 48, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.surfaceMuted },
  confirm: { backgroundColor: colors.primary },
  destructive: { backgroundColor: colors.danger },
  loading: { opacity: 0.6 },
  cancelLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
  confirmLabel: { fontSize: 16, fontWeight: '700', color: colors.onPrimary },
});
