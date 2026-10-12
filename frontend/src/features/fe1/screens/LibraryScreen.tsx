import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { BottomSheetModal } from '../components/common/BottomSheetModal';
import { CatBooksDecor } from '../components/common/Decor';
import { Icon, type IconName } from '../components/common/Icon';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { EmptyView, ErrorView, LoadingView } from '../components/common/StateView';
import { BookShelfSection } from '../components/library/BookShelfSection';
import { LibraryCategoryTab } from '../components/library/LibraryCategoryTab';
import { LibraryCustomizeButton } from '../components/library/LibraryCustomizeButton';
import { LibrarySortSelector } from '../components/library/LibrarySortSelector';
import { FE1_ROUTES } from '../constants/routes';
import { colors, radius, serifFont, softShadow, spacing } from '../constants/theme';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleAddBook = () => router.push(FE1_ROUTES.search);
  const handleBookPress = (bookId: number) => router.push({ pathname: FE1_ROUTES.detail, params: { bookId: String(bookId) } });
  const handleCustomize = () => router.push(FE1_ROUTES.customize);
  const runMenu = (action: () => void) => () => {
    setIsMenuOpen(false);
    action();
  };

  const renderContent = () => {
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

  return (
    <ScreenContainer backgroundColor={palette.wall}>
      <WallLight />
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text accessibilityRole="header" style={[styles.title, { color: palette.text }]}>나의 서재</Text>
          <Text style={[styles.quote, { color: palette.text }]}>“좋은 책이, 좋은 하루를 만든다.”</Text>
        </View>
        <Poster />
        <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="책 검색해서 추가하기" onPress={handleAddBook} style={styles.iconButton}>
            <Icon name="search" size={24} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="서재 메뉴" onPress={() => setIsMenuOpen(true)} style={styles.iconButton}>
            <Icon name="more" size={24} />
          </Pressable>
        </View>
      </View>

      <View style={styles.filterRow}>
        <View style={styles.tabs}>
          <LibraryCategoryTab
            selectedCategory={library.selectedCategory}
            onCategoryChange={library.setSelectedCategory}
            counts={library.books ? library.counts : undefined}
          />
        </View>
      </View>
      <View style={styles.sortRow}>
        <LibrarySortSelector sortType={library.sortType} onSortChange={library.setSortType} />
      </View>

      {library.error && library.books ? (
        <Pressable accessibilityRole="button" onPress={library.reload}>
          <Text style={styles.staleError}>최신 정보를 불러오지 못했어요. 눌러서 다시 시도</Text>
        </Pressable>
      ) : null}

      <View style={styles.shelves}>{renderContent()}</View>

      <BottomSheetModal visible={isMenuOpen} title="나의 서재" onClose={() => setIsMenuOpen(false)}>
        <View>
          <MenuItem icon="plus" label="책 추가하기" onPress={runMenu(handleAddBook)} />
          <LibraryCustomizeButton onPress={runMenu(handleCustomize)} />
        </View>
      </BottomSheetModal>
    </ScreenContainer>
  );
}

/** 벽에 붙은 'Good Books Better Me' 메모 */
function Poster() {
  return (
    <View style={styles.poster} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.pin} />
      <Text style={styles.posterText}>{'Good\nBooks\nBetter Me'}</Text>
      <Icon name="heart" size={10} color="#D9826F" />
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

function MenuItem({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.menuItem}>
      <Icon name={icon} size={22} />
      <Text style={styles.menuLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: spacing.lg, gap: spacing.sm },
  titleWrap: { flex: 1, gap: spacing.sm, paddingTop: spacing.sm },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -0.8 },
  quote: { fontSize: 15, opacity: 0.8 },
  poster: { position: 'absolute', right: 112, top: -spacing.sm, width: 70, paddingTop: spacing.md, paddingBottom: spacing.sm, alignItems: 'center', gap: 4, backgroundColor: '#F7EFE3', transform: [{ rotate: '2deg' }], ...softShadow },
  pin: { position: 'absolute', top: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#B98A5E' },
  posterText: { fontFamily: serifFont, fontSize: 11, lineHeight: 15, color: '#6B5A48', textAlign: 'center' },
  headerActions: { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.sm },
  iconButton: { width: 48, height: 48, borderRadius: radius.button, backgroundColor: 'rgba(255,252,247,0.92)', alignItems: 'center', justifyContent: 'center', ...softShadow },
  filterRow: { flexDirection: 'row', marginTop: spacing.xs },
  tabs: { flex: 1 },
  sortRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: -spacing.sm },
  staleError: { fontSize: 13, color: colors.danger },
  shelves: { flexGrow: 1 },
  cabinetWrap: { marginHorizontal: -spacing.md, paddingTop: 92, marginTop: -spacing.lg },
  cat: { right: spacing.lg, top: 0, zIndex: 2 },
  cabinet: { borderLeftWidth: 12, borderRightWidth: 12, paddingBottom: spacing.md, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  cabinetTop: { height: 14, borderBottomWidth: 4, marginHorizontal: -12, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4, minHeight: 54, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  menuLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
});
