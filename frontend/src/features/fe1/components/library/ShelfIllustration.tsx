import { StyleSheet, View } from 'react-native';
import type { LibraryTheme } from '../../types/reading';

const SPINE_HEIGHTS = [0.82, 0.95, 0.7, 0.9, 0.78, 0.98, 0.74, 0.88];

/**
 * 테마 팔레트로 그린 책장 일러스트.
 * 실제 테마 이미지 에셋이 프로젝트에 없어 View로 표현한다. 에셋이 준비되면 이미지로 교체한다.
 */
export function ShelfIllustration({ theme, height = 110, spineCount = 8 }: { theme: LibraryTheme; height?: number; spineCount?: number }) {
  const { palette } = theme;
  const shelfHeight = height * 0.42;
  return (
    <View style={[styles.wall, { height, backgroundColor: palette.wall }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.window, { borderColor: palette.shelfEdge, height: height * 0.32 }]} />
      <View style={[styles.shelf, { height: shelfHeight, backgroundColor: palette.shelf }]}>
        <View style={styles.spines}>
          {Array.from({ length: spineCount }, (_, index) => (
            <View
              key={index}
              style={[
                styles.spine,
                {
                  height: `${SPINE_HEIGHTS[index % SPINE_HEIGHTS.length] * 100}%`,
                  backgroundColor: palette.spines[index % palette.spines.length],
                },
              ]}
            />
          ))}
          <View style={[styles.plant, { backgroundColor: palette.accent }]} />
        </View>
        <View style={[styles.board, { backgroundColor: palette.shelfEdge }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wall: { width: '100%', justifyContent: 'flex-end', overflow: 'hidden' },
  window: { position: 'absolute', top: '12%', left: '14%', width: '26%', borderWidth: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)' },
  shelf: { marginHorizontal: '8%', justifyContent: 'flex-end' },
  spines: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 2, paddingHorizontal: 6, paddingTop: 4 },
  spine: { flex: 1, borderTopLeftRadius: 1, borderTopRightRadius: 1 },
  plant: { width: 12, height: '55%', borderRadius: 6, marginLeft: 4, opacity: 0.9 },
  board: { height: 5 },
});
