import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, keepAllWords, radius, spacing } from '../../constants/theme';
import { HIT_SLOP } from '@/constants/layout';
import type { ReadingPhoto } from '../../types/reading';
import { Icon, type IconName } from '../common/Icon';

type BookPhotoUploaderProps = {
  /** 첨부한 인증 사진 (최대 1장) */
  photo: ReadingPhoto | null;
  onRemove: () => void;
  /** 카메라 촬영 */
  onTakePhoto?: () => void;
  /** 갤러리 선택 */
  onPickFromGallery?: () => void;
  /** 권한 거부, 검증 실패 등 안내 */
  errorMessage?: string | null;
};

/** 책 사진 인증 (선택 항목, 1장). 사진이 있으면 검증 상태를 보여주고, 없으면 촬영·선택 버튼을 보여준다. */
export function BookPhotoUploader({ photo, onRemove, onTakePhoto, onPickFromGallery, errorMessage }: BookPhotoUploaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {photo ? (
          <View style={styles.thumb}>
            <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="첨부한 책 사진" />
            {photo.status === 'verifying' ? (
              <View style={styles.verifying} accessibilityLiveRegion="polite">
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.verifyingLabel}>확인 중…</Text>
              </View>
            ) : (
              <View style={styles.verifiedBadge} accessibilityLabel="인증 완료">
                <Icon name="check" size={12} color={colors.onPrimary} />
                <Text style={styles.verifiedLabel}>인증 완료</Text>
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="사진 삭제"
              hitSlop={HIT_SLOP}
              onPress={onRemove}
              style={styles.remove}
            >
              <Icon name="close" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <>
            <PickButton icon="camera" label="사진 촬영하기" onPress={onTakePhoto} />
            <PickButton icon="gallery" label="갤러리에서 선택하기" onPress={onPickFromGallery} />
          </>
        )}
      </View>
      {errorMessage ? <Text style={styles.notice} accessibilityRole="alert">{errorMessage}</Text> : null}
    </View>
  );
}

function PickButton({ icon, label, onPress }: { icon: IconName; label: string; onPress?: () => void }) {
  const disabled = !onPress;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.pick, disabled && styles.disabled]}
    >
      <Icon name={icon} size={30} color={colors.primaryLight} />
      <Text style={styles.pickLabel}>{label}</Text>
    </Pressable>
  );
}

const TILE = 128;

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm + 4 },
  pick: { width: TILE, height: TILE * 0.8, borderRadius: radius.input, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primaryBorder, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.sm },
  disabled: { opacity: 0.7 },
  pickLabel: { fontSize: 14, color: colors.text, textAlign: 'center', ...keepAllWords },
  thumb: { width: TILE, height: TILE * 0.8, borderRadius: radius.input, overflow: 'hidden', backgroundColor: colors.surfaceMuted },
  verifying: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(23,23,23,0.45)', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  verifyingLabel: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  verifiedBadge: { position: 'absolute', left: 6, bottom: 6, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.primary },
  verifiedLabel: { fontSize: 11, fontWeight: '700', color: colors.onPrimary },
  remove: { position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(23,23,23,0.7)', alignItems: 'center', justifyContent: 'center' },
  notice: { fontSize: 13, color: colors.danger, ...keepAllWords },
});
