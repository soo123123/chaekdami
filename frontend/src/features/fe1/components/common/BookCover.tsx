import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { colors, keepAllWords, radius, serifFont } from '../../constants/theme';

type BookCoverProps = {
  uri?: string;
  title: string;
  author?: string;
  width: number;
  /** 기본 비율 1:1.45 */
  height?: number;
};

/** 표지 이미지가 없을 때 쓰는 그림 표지 팔레트 (하늘 → 지면 → 실루엣) */
const PALETTES = [
  { top: '#8DB4D6', bottom: '#F2C9A0', hill: '#5E8A6B', text: '#203A55' },
  { top: '#1F2C52', bottom: '#5B4C7A', hill: '#141B33', text: '#F4EBDD' },
  { top: '#F6D9B8', bottom: '#E59C6B', hill: '#9A5B3C', text: '#5A2E1A' },
  { top: '#A9B7AE', bottom: '#5F786B', hill: '#2F4A3E', text: '#F4F1E8' },
  { top: '#E8C8D2', bottom: '#8E7BA8', hill: '#4C3D63', text: '#3A2A4A' },
  { top: '#D9D3C7', bottom: '#8F8A80', hill: '#3E3B36', text: '#2A2723' },
];

function seedOf(text: string) {
  return Array.from(text).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

/** 표지 이미지. 이미지가 없으면 제목으로 만든 그림 표지를 보여준다. */
export function BookCover({ uri, title, author, width, height = Math.round(width * 1.45) }: BookCoverProps) {
  const size = { width, height };
  if (uri) {
    return (
      <View style={[styles.frame, size]}>
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={`${title} 표지`} transition={150} />
        <View style={styles.spine} />
      </View>
    );
  }
  const seed = seedOf(title);
  const palette = PALETTES[seed % PALETTES.length];
  const gradientId = `cover-${seed}`;
  const titleSize = Math.max(9, Math.round(width / 7.2));
  const showAuthor = !!author && width >= 70;
  // 언덕 실루엣 모양도 제목에 따라 조금씩 다르게
  const peak = 0.62 + ((seed % 7) / 7) * 0.12;
  const hills = `M0 ${height * 0.86} Q ${width * 0.3} ${height * peak} ${width * 0.55} ${height * 0.8} T ${width} ${height * 0.74} L ${width} ${height} L 0 ${height} Z`;

  return (
    <View accessibilityLabel={`${title} 기본 표지`} style={[styles.frame, size]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.top} />
            <Stop offset="1" stopColor={palette.bottom} />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={height} fill={`url(#${gradientId})`} />
        <Path d={hills} fill={palette.hill} opacity={0.85} />
      </Svg>
      <View style={[styles.textWrap, { paddingTop: height * 0.12, paddingHorizontal: width * 0.1 }]}>
        <Text numberOfLines={3} style={[styles.title, { color: palette.text, fontSize: titleSize, lineHeight: titleSize * 1.3 }]}>
          {title}
        </Text>
        {showAuthor ? (
          <Text numberOfLines={1} style={[styles.author, { color: palette.text, fontSize: Math.max(8, titleSize * 0.55) }]}>
            {author}
          </Text>
        ) : null}
      </View>
      <View style={styles.spine} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: radius.cover, overflow: 'hidden', backgroundColor: colors.surfaceMuted },
  spine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: 'rgba(0,0,0,0.12)' },
  textWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', gap: 4 },
  title: { fontFamily: serifFont, fontWeight: '600', textAlign: 'center', ...keepAllWords },
  author: { fontFamily: serifFont, opacity: 0.85, textAlign: 'center' },
});
