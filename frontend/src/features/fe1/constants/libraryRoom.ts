import type { ImageSourcePropType } from 'react-native';

/**
 * 오브젝트 배치 정보.
 * - centerX: 화면 폭 대비 가로 중심 위치 (0~1)
 * - height / width / widthRatio: 크기 (하나만 주면 원본 비율 유지, 가로·세로 둘 다 주면 그 크기로 늘림)
 */
export type RoomDecor = {
  source: ImageSourcePropType;
  centerX: number;
  height?: number;
  width?: number;
  /** 화면 폭 대비 가로 크기 (0~1). width보다 우선 */
  widthRatio?: number;
  /** 바닥 접촉 그림자 표시 여부 (기본 true) */
  contactShadow?: boolean;
  /** 드롭 그림자 표시 여부 (기본 true) */
  dropShadow?: boolean;
};

/**
 * 책장 틀 이미지 조각 (틀 그림을 투명 처리한 뒤 잘라 쓴다).
 * 숫자는 모두 원본 조각의 px 기준이며, 화면 폭에 맞춰 비율로 환산한다.
 */
export type RoomFrame = {
  /** 맨 위 판. 위쪽 장식(예: 행성)이 판 위로 튀어나오면 그 높이를 topOverhang에 적는다 */
  top: ImageSourcePropType;
  topHeight: number;
  /** top 조각 중 판 위로 튀어나온 장식 높이 (벽 위에 겹쳐 그린다) */
  topOverhang?: number;
  /** 칸 옆면 조각 (옆판 + 안쪽 옆벽, 가운데 투명). 칸 순서대로, 모자라면 마지막 조각을 다시 쓴다 */
  sides: ImageSourcePropType[];
  /** 칸 사이 선반 판 조각. 위에서부터 순서대로, 모자라면 마지막 조각을 다시 쓴다 */
  shelves: ImageSourcePropType[];
  shelfHeight: number;
  /** 맨 아래 판 */
  bottom: ImageSourcePropType;
  bottomHeight: number;
  /** 조각 원본 폭 */
  sourceWidth: number;
  /** 칸 안쪽(안쪽 옆벽 사이) 왼쪽·오른쪽 경계 */
  innerLeft: number;
  innerRight: number;
  /** 선반 판 윗면 깊이 (책이 서는 면) */
  surfaceDepth: number;
  /** 판 두께 조절 비율 (원본이 두꺼우면 눌러서 쓴다) */
  thicknessScale: number;
};

/** 테마별 서재 방 구성 (배경 + 책장 틀 이미지 + 칸 뒷판 + 책장 위 오브젝트) */
export type LibraryRoomTheme = {
  /** 화면 전체 뒤에 까는 배경 이미지 (화면을 덮도록 채움). 없으면 wallColor 단색 */
  wall?: ImageSourcePropType;
  /** 배경 색 (배경 이미지가 없거나 불러오기 전) */
  wallColor: string;
  /** 칸 안쪽 뒷판에 반복해서 까는 질감. 없으면 틀 사이로 배경이 그대로 보인다 */
  back?: ImageSourcePropType;
  /** 뒷판 질감 위에 덮는 색 (선택) */
  backPanelTint?: string;
  /** 책장 틀 */
  frame: RoomFrame;
  /** 그림자 색 (테마 톤에 맞춘 어두운 색) */
  shadowColor: string;
  /** 책장 맨 위 판 위에 놓는 오브젝트 */
  shelfTop: RoomDecor[];
};

/** 방 레이아웃 공통 치수 (pt) */
export const ROOM = {
  /**
   * 헤더 아래 ~ 책장 맨 위 사이 여백 (책장 위 오브젝트가 놓이는 공간).
   * 가장 큰 오브젝트(흉상 84pt)가 필터 줄과 겹치지 않는 높이로 둔다.
   */
  headerGap: 84,
  rows: 3,
  /**
   * 칸 안쪽 높이. 화면 높이에 맞춰 3칸이 한 번에 보이도록 계산하되 이 범위 안에서만 바꾼다.
   * (최소보다 작은 화면에서는 책장이 세로로 스크롤된다)
   */
  rowInnerMin: 130,
  rowInnerMax: 180,
  /** 화면 높이를 모를 때 쓰는 기본 칸 높이 */
  rowInnerDefault: 150,
} as const;

/** 방 구성이 있는 테마. 여기에 없는 테마는 기존 팔레트 책장으로 그린다. */
export const LIBRARY_ROOMS: Partial<Record<string, LibraryRoomTheme>> = {
  'warm-sunlight': {
    // 수채화 종이 질감의 벽 (덩굴 없는 버전)
    wall: require('../assets/themes/warm-sunlight/wall_watercolor.webp'),
    wallColor: '#FDDCA6',
    back: require('../assets/themes/warm-sunlight/wood.webp'),
    // 틀의 꿀색 나무(평균 #E6984C)와 비슷한 색. 틀과 구분되도록 조금만 어둡게(결과 약 #CD8744)
    backPanelTint: 'rgba(224, 161, 83, 0.6)',
    frame: {
      top: require('../assets/themes/warm-sunlight/frame_top.webp'),
      topHeight: 75,
      sides: [require('../assets/themes/warm-sunlight/frame_open.webp')],
      shelves: [require('../assets/themes/warm-sunlight/frame_shelf.webp')],
      shelfHeight: 61,
      bottom: require('../assets/themes/warm-sunlight/frame_bottom.webp'),
      bottomHeight: 62,
      sourceWidth: 1014,
      innerLeft: 59,
      innerRight: 957,
      surfaceDepth: 14,
      thicknessScale: 0.85,
    },
    shadowColor: '#3C1E0A',
    // 책장 위 오브젝트는 서재 꾸미기에서 사용자가 고르는 기능이 생기면 채운다.
    // 쓸 수 있는 이미지: assets/themes/warm-sunlight/bust.webp, cat.webp
    shelfTop: [],
  },
  'cosmic-night': {
    wall: require('../assets/themes/cosmic-night/wall.webp'),
    wallColor: '#383A6B',
    // 칸 뒷판 없이 틀 사이로 배경이 그대로 보인다
    frame: {
      // 맨 위 판 가운데 행성 장식이 판 위로 72px 튀어나와 있다
      top: require('../assets/themes/cosmic-night/frame_top.webp'),
      topHeight: 156,
      topOverhang: 72,
      // 옆판 별 장식이 늘어나 보이지 않도록 칸마다 실제 옆면 조각을 쓴다
      sides: [
        require('../assets/themes/cosmic-night/frame_side1.webp'),
        require('../assets/themes/cosmic-night/frame_side2.webp'),
        require('../assets/themes/cosmic-night/frame_side3.webp'),
      ],
      shelves: [
        require('../assets/themes/cosmic-night/frame_shelf1.webp'),
        require('../assets/themes/cosmic-night/frame_shelf2.webp'),
      ],
      shelfHeight: 61,
      bottom: require('../assets/themes/cosmic-night/frame_bottom.webp'),
      bottomHeight: 78,
      sourceWidth: 1005,
      innerLeft: 61,
      innerRight: 939,
      surfaceDepth: 12,
      thicknessScale: 0.9,
    },
    shadowColor: '#0E0B2E',
    shelfTop: [],
  },
  'neon-city': {
    // 비 내리는 네온 도시 배경
    wall: require('../assets/themes/neon-city/wall.webp'),
    wallColor: '#7982A1',
    // 칸 뒷판 없이 틀 사이로 배경이 그대로 보인다
    frame: {
      // 맨 위 판의 고양이 장식·배관이 판 위로 46px 튀어나와 있다
      top: require('../assets/themes/neon-city/frame_top.webp'),
      topHeight: 130,
      topOverhang: 46,
      // 옆판 네온 장식이 늘어나 보이지 않도록 칸마다 실제 옆면 조각을 쓴다
      sides: [
        require('../assets/themes/neon-city/frame_side1.webp'),
        require('../assets/themes/neon-city/frame_side2.webp'),
        require('../assets/themes/neon-city/frame_side3.webp'),
      ],
      shelves: [
        require('../assets/themes/neon-city/frame_shelf1.webp'),
        require('../assets/themes/neon-city/frame_shelf2.webp'),
      ],
      shelfHeight: 71,
      bottom: require('../assets/themes/neon-city/frame_bottom.webp'),
      bottomHeight: 98,
      sourceWidth: 992,
      innerLeft: 71,
      innerRight: 922,
      surfaceDepth: 14,
      thicknessScale: 0.8,
    },
    shadowColor: '#1A1530',
    shelfTop: [],
  },
};
