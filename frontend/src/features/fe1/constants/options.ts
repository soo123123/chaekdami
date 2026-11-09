import type {
  LibraryFilter,
  LibrarySort,
  LibraryTheme,
  SearchCategory,
  SearchSort,
  ThemeCategory,
} from '../types/reading';

export type Option<T extends string> = { value: T; label: string };

export const SEARCH_CATEGORIES: Option<SearchCategory>[] = [
  { value: 'all', label: '전체' },
  { value: 'domestic', label: '국내도서' },
  { value: 'foreign', label: '해외도서' },
  { value: 'ebook', label: '전자책' },
];

export const SEARCH_SORTS: Option<SearchSort>[] = [
  { value: 'accuracy', label: '정확도순' },
  { value: 'latest', label: '최신순' },
  { value: 'rating', label: '평점순' },
];

export const LIBRARY_FILTERS: Option<LibraryFilter>[] = [
  { value: 'all', label: '전체' },
  { value: 'READING', label: '읽는 중' },
  { value: 'COMPLETED', label: '완독' },
  { value: 'NOT_STARTED', label: '읽기 전' },
];

export const LIBRARY_SORTS: Option<LibrarySort>[] = [
  { value: 'recent', label: '최근 추가순' },
  { value: 'title', label: '제목순' },
  { value: 'progress', label: '진행률순' },
];

export const THEME_CATEGORIES: Option<ThemeCategory>[] = [
  { value: 'all', label: '전체 테마' },
  { value: 'warm', label: '따뜻한 분위기' },
  { value: 'modern', label: '모던 & 심플' },
  { value: 'nature', label: '자연 & 힐링' },
  { value: 'mood', label: '감성 & 무드' },
];

export const MAX_SENTENCE_LENGTH = 500;
export const MAX_TITLE_LENGTH = 100;
export const MAX_AUTHOR_LENGTH = 50;
export const MAX_PUBLISHER_LENGTH = 50;
export const MAX_RECENT_SEARCHES = 10;

/**
 * 서재 테마 목록.
 * 프로젝트에 테마 일러스트 에셋이 없으므로 색상 팔레트로 책장을 그려 미리보기를 제공한다.
 * 테마 목록의 출처(서버 제공 여부)는 미확정이다.
 */
export const LIBRARY_THEMES: LibraryTheme[] = [
  {
    themeId: 'warm-sunlight',
    name: '따뜻한 햇살',
    description: '햇살이 가득한 오후,\n포근한 나만의 서재',
    category: 'warm',
    palette: { wall: '#FDDDA6', shelf: '#B07A45', shelfEdge: '#8A5A2E', accent: '#286247', spines: ['#2F5D50', '#C9A46B', '#5B7A9A', '#8A4B3C', '#3E4E5E'], text: '#3B2A1A' },
  },
  {
    themeId: 'cosmic-night',
    name: '별빛 우주',
    description: '별과 행성이 반짝이는\n밤하늘 서재',
    category: 'mood',
    palette: { wall: '#20295C', shelf: '#6B4FA0', shelfEdge: '#4A3577', accent: '#F2C46D', spines: ['#C9A46B', '#8C79C8', '#5B4A9A', '#3E4E8E', '#D8C9A3'], text: '#F4EEDF' },
  },
  {
    themeId: 'neon-city',
    name: '네온 시티',
    description: '비 내리는 밤, 네온이 빛나는\n미래 도시 서재',
    category: 'modern',
    palette: { wall: '#4A5378', shelf: '#8E7FA0', shelfEdge: '#5E5272', accent: '#FF7AC8', spines: ['#FF7AC8', '#6FE3F0', '#8E7FA0', '#5E6A92', '#D9D2E9'], text: '#F4F1FA' },
  },
];

export const DEFAULT_THEME_ID = LIBRARY_THEMES[0].themeId;
