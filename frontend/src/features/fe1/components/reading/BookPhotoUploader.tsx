import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, HIT_SLOP, keepAllWords, radius, spacing } from '../../constants/theme';
import type { ReadingPhoto } from '../../types/reading';
import { Icon, type IconName } from '../common/Icon';

type BookPhotoUploaderProps = {
  photos: ReadingPhoto[];
  onChange: (photos: ReadingPhoto[]) => void;
  /** 카메라 촬영 */
  onTakePhoto?: () => void;
  /** 갤러리 선택 */
  onPickFromGallery?: () => void;
  /** 권한 거부 등 사진 선택 오류 안내 */
  errorMessage?: string | null;
};

/** 책 사진 첨부 (선택 항목) */
export function BookPhotoUploader({ photos, onChange, onTakePhoto, onPickFromGallery, errorMessage }: BookPhotoUploaderProps) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <PickButton icon="camera" label="사진 촬영하기" onPress={onTakePhoto} />
        <PickButton icon="gallery" label="갤러리에서 선택하기" onPress={onPickFromGallery} />
        {photos.map(photo => (
          <View key={photo.uri} style={styles.thumb}>
            <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="첨부한 책 사진" />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="사진 삭제"
              hitSlop={HIT_SLOP}
              onPress={() => onChange(photos.filter(p => p.uri !== photo.uri))}
              style={styles.remove}
            >
              <Icon name="close" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ))}
      </ScrollView>
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
  row: { gap: spacing.sm + 4 },
  pick: { width: TILE, height: TILE * 0.8, borderRadius: radius.input, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primaryBorder, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.sm },
  disabled: { opacity: 0.7 },
  pickLabel: { fontSize: 14, color: colors.text, textAlign: 'center', ...keepAllWords },
  thumb: { width: TILE, height: TILE * 0.8, borderRadius: radius.input, overflow: 'hidden', backgroundColor: colors.surfaceMuted },
  remove: { position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(23,23,23,0.7)', alignItems: 'center', justifyContent: 'center' },
  notice: { fontSize: 13, color: colors.danger },
});
