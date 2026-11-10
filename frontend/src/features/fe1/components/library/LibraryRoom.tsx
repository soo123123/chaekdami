import { Image } from 'expo-image';
import { useId, useState, type ReactNode } from 'react';
import {
  ImageBackground,
  Image as RNImage,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { ROOM, type LibraryRoomTheme, type RoomDecor } from '../../constants/libraryRoom';
import { colors, radius, spacing } from '../../constants/theme';
import type { BookStatus, LibraryFilter, RegisteredBook } from '../../types/reading';
import { BookCard } from '../book/BookCard';
import { AddBookButton } from './AddBookButton';

const ADD_ITEM = 'ADD' as const;
type ShelfItem = RegisteredBook | typeof ADD_ITEM;
type Section = { status: BookStatus; books: RegisteredBook[] };
type RowContent = {
  /** 칸 왼쪽 위 모서리의 이름표 (표시만, 누르는 기능 없음) */
  label?: string;
  items: ShelfItem[];
  emptyText?: string;
};

const BOOK_GAP = spacing.sm + 6;
const ROW_PADDING = spacing.md;
/** 이름표를 칸 왼쪽 위 모서리에 붙이고, 나머지 높이를 표지에 쓴다 (기존 84×124와 같은 비율) */
const LABEL_AREA = 30;
const COVER_RATIO = 84 / 124;

type LibraryRoomProps = {
  room: LibraryRoomTheme;
  /** 벽 위에 올릴 헤더 (제목, 버튼, 필터, 정렬) */
  header: ReactNode;
  sections: Section[];
  sectionTitles: Record<BookStatus, string>;
  selectedCategory: LibraryFilter;
  onBookPress: (bookId: number) => void;
  onAddBook: () => void;
  /** 로딩·오류·빈 서재일 때 책장 위에 띄울 내용 */
  stateView?: ReactNode;
  /** 방이 차지할 수 있는 화면 높이. 주어지면 3칸이 이 높이에 꼭 맞도록 칸 높이를 정한다 */
  availableHeight?: number;
};

/**
 * 테마 이미지로 꾸민 서재 방.
 * 벽(이미지) + 책장 틀(이미지 조각) + 칸 안쪽 뒷판(나뭇결)으로 구성하고, 오브젝트는 맨 위 판 윗면에 올린다.
 * 화면 높이에 맞춰 칸 높이와 책 표지 크기를 정해서, 3칸이 스크롤 없이 한 번에 보이게 한다.
 */
export function LibraryRoom({ room, header, sections, sectionTitles, selectedCategory, onBookPress, onAddBook, stateView, availableHeight }: LibraryRoomProps) {
  const { width } = useWindowDimensions();
  const [headerHeight, setHeaderHeight] = useState(0);
  const wallHeight = headerHeight + ROOM.headerGap;

  // 틀 조각 치수를 화면 폭 기준 pt로 환산 (판 두께는 thicknessScale만큼 눌러서 쓴다)
  const { frame } = room;
  const scale = width / frame.sourceWidth;
  const thick = scale * frame.thicknessScale;
  /** 맨 위 판 두께 (위로 튀어나온 장식 제외) */
  const topH = (frame.topHeight - (frame.topOverhang ?? 0)) * thick;
  const topOverhangH = (frame.topOverhang ?? 0) * thick;
  const shelfH = frame.shelfHeight * thick;
  const bottomH = frame.bottomHeight * thick;
  const innerLeft = frame.innerLeft * scale;
  const innerWidth = (frame.innerRight - frame.innerLeft) * scale;
  /** 책이 판 윗면 안쪽에 서도록 칸 아래로 내려 보내는 거리 */
  const standDepth = frame.surfaceDepth * thick * 0.6;

  // 벽·판을 뺀 나머지 높이를 3칸이 나눠 쓴다
  const fixed = wallHeight + topH + shelfH * (ROOM.rows - 1) + bottomH;
  const fittedRowInner = availableHeight ? (availableHeight - fixed) / ROOM.rows : ROOM.rowInnerDefault;
  const rowInner = Math.round(Math.min(ROOM.rowInnerMax, Math.max(ROOM.rowInnerMin, fittedRowInner)));
  const coverHeight = Math.round(rowInner - LABEL_AREA - 2 + standDepth);
  const coverWidth = Math.round(coverHeight * COVER_RATIO);

  const rows = stateView
    ? Array.from({ length: ROOM.rows }, () => ({ items: [] }) as RowContent)
    : buildRows({ sections, sectionTitles, selectedCategory, innerWidth, coverWidth });

  return (
    <View style={{ backgroundColor: room.wallColor }}>
      {/* 화면 전체 배경 (틀 모서리 바깥으로도 보이도록 방 전체 뒤에 깐다) */}
      {room.wall ? <Image source={room.wall} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} /> : null}

      {/* 헤더 영역 */}
      <View style={{ height: wallHeight }}>
        <View style={styles.header} onLayout={event => setHeaderHeight(event.nativeEvent.layout.height)}>
          {header}
        </View>
      </View>

      {/* 책장: 칸마다 뒷판 질감을 깔고 그 위에 틀 조각을 쌓는다 */}
      <View>
        {/* 맨 위 판 (위로 튀어나온 장식은 헤더 영역 아래쪽에 겹친다) */}
        <Image source={frame.top} style={{ width, height: topH + topOverhangH, marginTop: -topOverhangH }} contentFit="fill" accessible={false} />
        {rows.map((row, index) => {
          const isLast = index === ROOM.rows - 1;
          const boardH = isLast ? bottomH : shelfH;
          const side = frame.sides[Math.min(index, frame.sides.length - 1)];
          const board = isLast ? frame.bottom : frame.shelves[Math.min(index, frame.shelves.length - 1)];
          return (
            <View key={index} style={{ height: rowInner + boardH }}>
              {/* 칸 안쪽 뒷판 (없는 테마는 배경이 그대로 보인다) */}
              {room.back ? (
                <ImageBackground
                  source={room.back}
                  resizeMode="repeat"
                  style={[styles.backPanel, { left: innerLeft, width: innerWidth, height: rowInner }]}
                >
                  {room.backPanelTint ? <View style={[StyleSheet.absoluteFill, { backgroundColor: room.backPanelTint }]} /> : null}
                </ImageBackground>
              ) : null}
              <Image source={side} style={[styles.abs, { top: 0, width, height: rowInner }]} contentFit="fill" accessible={false} />
              <Image source={board} style={[styles.abs, { top: rowInner, width, height: boardH }]} contentFit="fill" accessible={false} />
              {/* 책: 칸 안쪽에서만 보이게 자르고, 바닥은 판 윗면에 걸치게 한다 */}
              <View style={[styles.abs, styles.clip, { left: innerLeft, width: innerWidth, height: rowInner + standDepth }]}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.row, { height: rowInner + standDepth }]}
                >
                  {row.items.map(item =>
                    item === ADD_ITEM ? (
                      <AddBookButton key="add" onPress={onAddBook} width={coverWidth} height={coverHeight} />
                    ) : (
                      <BookCard key={item.bookId} variant="shelf" book={item} onPress={onBookPress} coverWidth={coverWidth} coverHeight={coverHeight} />
                    ),
                  )}
                  {row.items.length === 0 && row.emptyText ? (
                    <View style={[styles.emptySlot, { height: coverHeight }]}><Text style={styles.emptyText}>{row.emptyText}</Text></View>
                  ) : null}
                </ScrollView>
              </View>
              {row.label ? (
                <View style={[styles.label, { left: innerLeft }]} pointerEvents="none">
                  <Text style={styles.labelText}>{row.label}</Text>
                </View>
              ) : null}
            </View>
          );
        })}
        {stateView ? (
          <View style={[styles.stateOverlay, { top: topH, height: ROOM.rows * rowInner + shelfH * (ROOM.rows - 1) + bottomH, left: innerLeft + spacing.sm, width: innerWidth - spacing.sm * 2 }]}>
            <View style={styles.stateCard}>{stateView}</View>
          </View>
        ) : null}
      </View>

      {/* 맨 위 판 윗면에 올리는 오브젝트 (판 이미지보다 위에 그린다) */}
      {room.shelfTop.map((decor, index) => (
        <Decor key={index} decor={decor} screenWidth={width} baseline={wallHeight + topH * 0.35} shadowColor={room.shadowColor} />
      ))}
    </View>
  );
}

/**
 * 칸별로 올릴 책을 정한다.
 * - 전체: 읽는 중 / 완독 / 읽기 전을 1~3번 칸에 하나씩 두고 이름표를 붙인다 (기존 책장과 동일).
 * - 상태 필터: 해당 책을 1번 칸부터 채우고, 넘치는 책은 마지막 칸에서 가로 스크롤한다.
 * '책 추가하기' 칸은 읽는 중 책 뒤에 둔다.
 */
function buildRows({
  sections,
  sectionTitles,
  selectedCategory,
  innerWidth,
  coverWidth,
}: {
  sections: Section[];
  sectionTitles: Record<BookStatus, string>;
  selectedCategory: LibraryFilter;
  innerWidth: number;
  coverWidth: number;
}): RowContent[] {
  const withAdd = (section: Section): ShelfItem[] => (section.status === 'READING' ? [...section.books, ADD_ITEM] : section.books);

  if (selectedCategory === 'all') {
    return Array.from({ length: ROOM.rows }, (_, index) => {
      const section = sections[index];
      if (!section) return { items: [] };
      return {
        label: sectionTitles[section.status],
        items: withAdd(section),
        emptyText: '아직 책이 없어요',
      };
    });
  }

  const section = sections[0];
  const items = section ? withAdd(section) : [];
  const perRow = Math.max(1, Math.floor((innerWidth - ROW_PADDING * 2 + BOOK_GAP) / (coverWidth + BOOK_GAP)));
  return Array.from({ length: ROOM.rows }, (_, index) => {
    const isLast = index === ROOM.rows - 1;
    const start = index * perRow;
    return {
      label: index === 0 && section ? sectionTitles[section.status] : undefined,
      items: isLast ? items.slice(start) : items.slice(start, start + perRow),
      emptyText: index === 0 ? '아직 책이 없어요' : undefined,
    };
  });
}

type DecorProps = { decor: RoomDecor; screenWidth: number; baseline: number; shadowColor: string };

/** 오브젝트 이미지 + 바닥 접촉 그림자 + 드롭 그림자 (빛은 왼쪽 위 → 그림자는 오른쪽 아래) */
function Decor({ decor, screenWidth, baseline, shadowColor }: DecorProps) {
  const id = `contact-${useId().replace(/:/g, '')}`;
  const { width, height } = decorSize(decor, screenWidth);
  const left = decor.centerX * screenWidth - width / 2;
  const top = baseline - height;
  const contactHeight = 12;
  return (
    <>
      {decor.contactShadow !== false ? (
        <Svg pointerEvents="none" style={{ position: 'absolute', left, top: baseline - contactHeight / 2, width, height: contactHeight }}>
          <Defs>
            <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0" stopColor={shadowColor} stopOpacity={0.4} />
              <Stop offset="1" stopColor={shadowColor} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx="50%" cy="50%" rx="50%" ry="50%" fill={`url(#${id})`} />
        </Svg>
      ) : null}
      {decor.dropShadow !== false ? (
        <Image
          source={decor.source}
          tintColor={shadowColor}
          blurRadius={3}
          contentFit="fill"
          accessible={false}
          pointerEvents="none"
          style={{ position: 'absolute', left: left + 4, top: top + 4, width, height, opacity: 0.28 }}
        />
      ) : null}
      <Image
        source={decor.source}
        contentFit="fill"
        accessible={false}
        pointerEvents="none"
        style={{ position: 'absolute', left, top, width, height }}
      />
    </>
  );
}

function decorSize(decor: RoomDecor, screenWidth: number) {
  const asset = RNImage.resolveAssetSource(decor.source as number);
  const ratio = asset ? asset.width / asset.height : 1;
  const fixedWidth = decor.widthRatio !== undefined ? decor.widthRatio * screenWidth : decor.width;
  if (fixedWidth !== undefined && decor.height !== undefined) return { width: fixedWidth, height: decor.height };
  if (fixedWidth !== undefined) return { width: fixedWidth, height: fixedWidth / ratio };
  const height = decor.height ?? 80;
  return { width: height * ratio, height };
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  abs: { position: 'absolute', left: 0 },
  header: { position: 'absolute', top: 0, left: 0, right: 0 },
  backPanel: { position: 'absolute', top: 0 },
  row: { alignItems: 'flex-end', gap: BOOK_GAP, paddingHorizontal: ROW_PADDING, paddingTop: LABEL_AREA, paddingBottom: 2 },
  // 칸 왼쪽 위 모서리에 붙는 작은 이름표 (위·왼쪽 모서리는 각지게)
  label: { position: 'absolute', top: 0, height: 24, justifyContent: 'center', backgroundColor: colors.shelfLabel, borderBottomRightRadius: radius.input, paddingHorizontal: spacing.sm + 2, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  labelText: { fontSize: 13, fontWeight: '800', color: colors.text },
  emptySlot: { justifyContent: 'center', paddingHorizontal: spacing.md },
  emptyText: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  stateOverlay: { position: 'absolute', justifyContent: 'center' },
  stateCard: { borderRadius: radius.card, backgroundColor: 'rgba(255,249,242,0.94)', paddingHorizontal: spacing.md },
});
