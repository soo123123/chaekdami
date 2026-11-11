import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBar, BOTTOM_TAB_BAR_HEIGHT } from '@/components/BottomTabBar';
import type { LibraryRoomTheme } from '../../constants/libraryRoom';
import { radius } from '../../constants/theme';
import type { BookStatus } from '../../types/reading';
import { LibraryRoom } from './LibraryRoom';

const SECTION_TITLES: Record<BookStatus, string> = { READING: '읽는 중', COMPLETED: '완독', NOT_STARTED: '읽기 전' };
/** 실제 서재 헤더(제목 + 필터 줄)와 비슷한 높이. 책장 위치가 실제 화면과 같아지도록 자리만 잡는다 */
const HEADER_PLACEHOLDER = 96;
const noop = () => {};

type ThemeRoomPreviewProps = {
  room: LibraryRoomTheme;
  /** 제목 글자색 (테마 palette.text) */
  titleColor: string;
  /** 미리보기 높이 (실제 화면 높이 대비 비율) */
  heightRatio?: number;
};

/**
 * 테마 미리보기: 실제 서재 화면을 책 없이 그대로 그린 뒤 축소해서 보여준다.
 * 배경, 책장 틀, 칸 뒷판이 서재 화면과 똑같은 비율로 보인다.
 */
export function ThemeRoomPreview({ room, titleColor, heightRatio = 0.6 }: ThemeRoomPreviewProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scale = heightRatio;
  const tabBarHeight = BOTTOM_TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) - 8;

  return (
    <View
      style={[styles.frame, { width: width * scale, height: height * scale }]}
      accessible
      accessibilityLabel="서재 테마 미리보기"
    >
      <View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={{
          position: 'absolute',
          width,
          height,
          left: -(width - width * scale) / 2,
          top: -(height - height * scale) / 2,
          transform: [{ scale }],
        }}
      >
        <View style={[styles.flex, { backgroundColor: room.wallColor }]}>
          <LibraryRoom
            room={room}
            header={
              <View style={[styles.header, { paddingTop: insets.top, height: insets.top + HEADER_PLACEHOLDER }]}>
                <Text style={[styles.title, { color: titleColor }]}>나의 서재</Text>
              </View>
            }
            sections={[]}
            sectionTitles={SECTION_TITLES}
            selectedCategory="all"
            onBookPress={noop}
            onAddBook={noop}
            availableHeight={height - tabBarHeight}
          />
        </View>
        <BottomTabBar active="library" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, overflow: 'hidden' },
  frame: { alignSelf: 'center', overflow: 'hidden', borderRadius: radius.card, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  header: { paddingHorizontal: 16, justifyContent: 'flex-start' },
  title: { fontSize: 24, fontWeight: '800', paddingTop: 8 },
});
