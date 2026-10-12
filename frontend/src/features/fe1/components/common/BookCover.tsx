import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../../constants/theme';

type BookCoverProps = {
  uri?: string;
  title: string;
  width: number;
  /** 기본 비율 1:1.45 */
  height?: number;
};

const PLACEHOLDER_COLORS = ['#7FA3B8', '#2F4A6A', '#C98B5A', '#5E7F62', '#8A6E9E', '#B86B5A'];

/** 표지 이미지. 이미지가 없으면 제목으로 만든 기본 표지를 보여준다. */
export function BookCover({ uri, title, width, height = Math.round(width * 1.45) }: BookCoverProps) {
  const size = { width, height };
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.cover, size]}
        contentFit="cover"
        accessibilityLabel={`${title} 표지`}
        transition={150}
      />
    );
  }
  const seed = Array.from(title).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const background = PLACEHOLDER_COLORS[seed % PLACEHOLDER_COLORS.length];
  return (
    <View accessibilityLabel={`${title} 기본 표지`} style={[styles.cover, styles.placeholder, size, { backgroundColor: background }]}>
      <View style={styles.spine} />
      <Text numberOfLines={4} style={[styles.placeholderText, { fontSize: Math.max(10, Math.round(width / 7)) }]}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { borderRadius: radius.cover, backgroundColor: colors.surfaceMuted },
  placeholder: { justifyContent: 'center', padding: 8, overflow: 'hidden' },
  spine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, backgroundColor: 'rgba(0,0,0,0.15)' },
  placeholderText: { color: '#FFFFFF', fontWeight: '600', textAlign: 'center' },
});
