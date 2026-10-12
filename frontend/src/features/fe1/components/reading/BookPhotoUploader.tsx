import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, HIT_SLOP, radius, spacing } from '../../constants/theme';
import type { ReadingPhoto } from '../../types/reading';

type BookPhotoUploaderProps = {
  photos: ReadingPhoto[];
  onChange: (photos: ReadingPhoto[]) => void;
  /** 카메라 촬영. 미지원 상태면 undefined */
  onTakePhoto?: () => void;
  /** 갤러리 선택. 미지원 상태면 undefined */
  onPickFromGallery?: () => void;
  /** 기능 미지원 시 안내 문구 */
  unavailableMessage?: string;
};

/** 책 사진 첨부 (선택 항목) */
export function BookPhotoUploader({ photos, onChange, onTakePhoto, onPickFromGallery, unavailableMessage }: BookPhotoUploaderProps) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <PickButton icon="📷" label="사진 촬영하기" onPress={onTakePhoto} />
        <PickButton icon="🖼" label="갤러리에서 선택하기" onPress={onPickFromGallery} />
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
              <Text style={styles.removeLabel}>✕</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
      {unavailableMessage ? <Text style={styles.notice}>{unavailableMessage}</Text> : null}
    </View>
  );
}

function PickButton({ icon, label, onPress }: { icon: string; label: string; onPress?: () => void }) {
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
      <Text style={styles.pickIcon}>{icon}</Text>
      <Text style={styles.pickLabel}>{label}</Text>
    </Pressable>
  );
}

const TILE = 120;

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: { gap: spacing.sm + 4 },
  pick: { width: TILE, height: TILE * 0.8, borderRadius: radius.input, borderWidth: 1, borderStyle: 'dashed', borderColor: '#B9CDBF', backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.sm },
  disabled: { opacity: 0.55 },
  pickIcon: { fontSize: 26 },
  pickLabel: { fontSize: 13, color: colors.text, textAlign: 'center' },
  thumb: { width: TILE, height: TILE * 0.8, borderRadius: radius.input, overflow: 'hidden', backgroundColor: colors.surfaceMuted },
  remove: { position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(23,23,23,0.7)', alignItems: 'center', justifyContent: 'center' },
  removeLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  notice: { fontSize: 12, color: colors.secondaryText },
});
