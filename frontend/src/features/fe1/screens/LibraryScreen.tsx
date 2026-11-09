import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBar } from '@/components/BottomTabBar';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { CatBooksDecor } from '../components/common/Decor';
import { Icon } from '../components/common/Icon';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { EmptyView, ErrorView, LoadingView } from '../components/common/StateView';
import { BookShelfSection } from '../components/library/BookShelfSection';
import { LibraryRoom } from '../components/library/LibraryRoom';
import { LibraryCategoryTab } from '../components/library/LibraryCategoryTab';
import { LibrarySortSelector } from '../components/library/LibrarySortSelector';
import { LIBRARY_ROOMS } from '../constants/libraryRoom';
import { FE1_ROUTES } from '../constants/routes';
import { colors, HIT_SLOP, noWebOutline, radius, softShadow, spacing } from '../constants/theme';
import { useLibraryBooks } from '../hooks/library/useLibraryBooks';
import type { BookStatus } from '../types/reading';

const SECTION_TITLES: Record<BookStatus, string> = {
  READING: '읽는 중',
  COMPLETED: '완독',
  NOT_STARTED: '읽기 전',
};

export function LibraryScreen() {
  const library = useLibraryBooks();
  const { theme } = library;
  const { palette } = theme;
  /** 돋보기를 누르면 제목 자리에 서재 내 검색창을 연다 */
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  /** 꾸민 방이 차지할 수 있는 높이 (하단 탭바 위까지) */
  const [roomHeight, setRoomHeight] = useState<number | undefined>(undefined);
  const insets = useSafeAreaInsets();
  // 방 구성(벽·나뭇결·오브젝트 이미지)이 있는 테마는 꾸민 방으로, 없는 테마는 팔레트로 그린 책장으로 보여준다.
  const room = LIBRARY_ROOMS[theme.themeId];

  const handleAddBook = () => router.push(FE1_ROUTES.search);
  const handleBookPress = (bookId: number) => router.push({ pathname: FE1_ROUTES.detail, params: { bookId: String(bookId) } });
  const handleCustomize = () => router.push(FE1_ROUTES.customize);
  const closeSearch = () => {
    setIsSearchOpen(false);
    library.setSearchQuery('');
  };

  /** 로딩·오류·빈 서재일 때 책 대신 보여줄 내용 (없으면 null) */
  const renderStateView = () => {
    if (library.isLoading && !library.books) return <LoadingView message="서재를 불러오는 중이에요…" />;
    if (library.error && !library.books) return <ErrorView error={library.error} onRetry={library.reload} />;
    if (library.isEmpty) {
      return (
        <EmptyView
          title="아직 서재가 비어 있어요"
          message="읽고 있는 책이나 읽고 싶은 책을 등록해보세요."
          actionLabel="책 추가하기"
          onAction={handleAddBook}
        />
      );
    }
    if (library.hasNoSearchResult) {
      return <EmptyView title={`'${library.searchQuery.trim()}'에 맞는 책이 없어요`} message="다른 제목이나 저자 이름으로 찾아보세요." />;
    }
    return null;
  };

  const renderContent = () => {
    const stateView = renderStateView();
    if (stateView) return stateView;
    return (
      <View style={styles.cabinetWrap}>
        <CatBooksDecor width={108} style={styles.cat} />
        <View style={[styles.cabinet, { backgroundColor: palette.shelf, borderColor: palette.shelfEdge }]}>
          <View style={[styles.cabinetTop, { backgroundColor: palette.shelf, borderBottomColor: palette.shelfEdge }]} />
          {library.sections.map(section => (
            <BookShelfSection
              key={section.status}
              title={SECTION_TITLES[section.status]}
              books={section.books}
              theme={theme}
              onBookPress={handleBookPress}
              // '책 추가하기' 칸은 읽는 중 책장(전체/읽는 중 필터)에 둔다.
              onAddBook={section.status === 'READING' ? handleAddBook : undefined}
              onTitlePress={library.selectedCategory === 'all' ? () => library.setSelectedCategory(section.status) : undefined}
            />
          ))}
        </View>
      </View>
    );
  };

  const headerContent = (
    <>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          {isSearchOpen ? (
            <View style={styles.searchBox}>
              <Icon name="search" size={20} color={colors.secondaryText} />
              <TextInput
                value={library.searchQuery}
                onChangeText={library.setSearchQuery}
                placeholder="서재에서 제목·저자 찾기"
                placeholderTextColor={colors.tertiaryText}
                returnKeyType="search"
                autoFocus
                autoCorrect={false}
                autoCapitalize="none"
                style={styles.searchInput}
                accessibilityLabel="서재 내 책 검색어"
              />
              {library.searchQuery.length > 0 ? (
                <Pressable accessibilityRole="button" accessibilityLabel="검색어 지우기" hitSlop={HIT_SLOP} onPress={() => library.setSearchQuery('')}>
                  <Icon name="close" size={18} color={colors.secondaryText} />
                </Pressable>
              ) : null}
            </View>
          ) : (
            <Text accessibilityRole="header" style={[styles.title, { color: palette.text }]}>나의 서재</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {isSearchOpen ? (
            <Pressable accessibilityRole="button" accessibilityLabel="서재 검색 닫기" onPress={closeSearch} style={styles.iconButton}>
              <Icon name="close" size={24} />
            </Pressable>
          ) : (
            <Pressable accessibilityRole="button" accessibilityLabel="서재에서 책 찾기" onPress={() => setIsSearchOpen(true)} style={styles.iconButton}>
              <Icon name="search" size={24} />
            </Pressable>
          )}
          <Pressable accessibilityRole="button" accessibilityLabel="서재 꾸미기" onPress={handleCustomize} style={styles.iconButton}>
            <Icon name="palette" size={24} />
          </Pressable>
        </View>
      </View>

      {/* 상태 필터와 정렬을 한 줄에 둔다 */}
      <View style={styles.filterRow}>
        <View style={styles.tabs}>
          <LibraryCategoryTab selectedCategory={library.selectedCategory} onCategoryChange={library.setSelectedCategory} />
        </View>
        <LibrarySortSelector sortType={library.sortType} onSortChange={library.setSortType} />
      </View>

      {library.error && library.books ? (
        <Pressable accessibilityRole="button" onPress={library.reload}>
          <Text style={styles.staleError}>최신 정보를 불러오지 못했어요. 눌러서 다시 시도</Text>
        </Pressable>
      ) : null}
    </>
  );

  if (room) {
    return (
      <View style={[styles.flex, { backgroundColor: room.wallColor }]}>
      <View style={styles.flex} onLayout={event => setRoomHeight(event.nativeEvent.layout.height)}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" bounces={false}>
          <LibraryRoom
            room={room}
            header={<View style={[styles.roomHeader, { paddingTop: insets.top }]}>{headerContent}</View>}
            sections={library.sections}
            sectionTitles={SECTION_TITLES}
            selectedCategory={library.selectedCategory}
            onBookPress={handleBookPress}
            onAddBook={handleAddBook}
            stateView={renderStateView()}
            availableHeight={roomHeight}
          />
        </ScrollView>
      </View>
      {/* 탭바는 서재 화면의 일부라 화면 전환 때 같이 밀려나고, 책장 높이는 그대로 유지된다 */}
      <BottomTabBar active="library" />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: palette.wall }]}>
      <ScreenContainer backgroundColor={palette.wall}>
        <WallLight />
        {headerContent}

        <View style={styles.shelves}>{renderContent()}</View>
      </ScreenContainer>
      <BottomTabBar active="library" />
    </View>
  );
}

/** 창가 햇살처럼 왼쪽 위가 밝은 벽 조명 */
function WallLight() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="wall-light" cx="15%" cy="0%" r="75%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.4} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#wall-light)" />
    </Svg>
  );
}


const styles = StyleSheet.create({
  flex: { flex: 1 },
  // 꾸민 방의 벽 위에 올리는 헤더 (기존 화면과 같은 좌우 여백)
  roomHeader: { paddingHorizontal: spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: spacing.xs, gap: spacing.sm },
  titleWrap: { flex: 1, justifyContent: 'center', minHeight: 48 },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -0.8 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, height: 48, paddingHorizontal: spacing.sm + 6, borderRadius: radius.button, backgroundColor: 'rgba(255,252,247,0.95)', ...softShadow },
  searchInput: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: 0, ...noWebOutline },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  iconButton: { width: 48, height: 48, borderRadius: radius.button, backgroundColor: 'rgba(255,252,247,0.92)', alignItems: 'center', justifyContent: 'center', ...softShadow },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  tabs: { flex: 1 },
  staleError: { fontSize: 13, color: colors.danger },
  shelves: { flexGrow: 1 },
  cabinetWrap: { marginHorizontal: -spacing.md, paddingTop: 92, marginTop: -spacing.lg },
  cat: { right: spacing.lg, top: 0, zIndex: 2 },
  cabinet: { borderLeftWidth: 12, borderRightWidth: 12, paddingBottom: spacing.md, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  cabinetTop: { height: 14, borderBottomWidth: 4, marginHorizontal: -12, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
});
