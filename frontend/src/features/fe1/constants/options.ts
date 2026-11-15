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
    palette: { wall: '#F4E3C8', shelf: '#B07A45', shelfEdge: '#8A5A2E', accent: '#286247', spines: ['#2F5D50', '#C9A46B', '#5B7A9A', '#8A4B3C', '#3E4E5E'], text: '#3B2A1A' },
  },
  {
    themeId: 'starry-night',
    name: '별빛의 밤',
    description: '별이 내려앉은 밤,\n고요한 독서 시간',
    category: 'mood',
    palette: { wall: '#2A3550', shelf: '#4A3B2E', shelfEdge: '#2F241B', accent: '#F2C46D', spines: ['#C9A46B', '#6C7FA6', '#A65D4E', '#3E5C76', '#D8C9A3'], text: '#F4EEDF' },
  },
  {
    themeId: 'white-garden',
    name: '화이트 가든',
    description: '하얀 벽과 초록 식물,\n산뜻한 서재',
    category: 'modern',
    palette: { wall: '#F7F5F0', shelf: '#E8E2D8', shelfEdge: '#CFC6B8', accent: '#5E8B5A', spines: ['#DCD3C1', '#A8B89A', '#E9E4D8', '#C7B79A', '#8FA58A'], text: '#2D2D2D' },
  },
  {
    themeId: 'vintage-brown',
    name: '빈티지 브라운',
    description: '은은한 조명 아래\n오래된 책 냄새',
    category: 'warm',
    palette: { wall: '#7A4E2A', shelf: '#5A3519', shelfEdge: '#3F240F', accent: '#F0B45B', spines: ['#2F4A5A', '#7A2F25', '#C9A46B', '#3C5A3A', '#8C6A3E'], text: '#FBEBD3' },
  },
  {
    themeId: 'modern-beige',
    name: '모던 베이지',
    description: '군더더기 없는\n차분한 베이지 톤',
    category: 'modern',
    palette: { wall: '#EFE6D8', shelf: '#D9CBB4', shelfEdge: '#BFAE93', accent: '#7C6A55', spines: ['#4A5D52', '#B9A27E', '#E5DCCB', '#6E7B6C', '#9C8566'], text: '#3A3226' },
  },
  {
    themeId: 'forest-rest',
    name: '숲속의 휴식',
    description: '숲 내음 가득한\n힐링 서재',
    category: 'nature',
    palette: { wall: '#C9D6B8', shelf: '#8B6A43', shelfEdge: '#6B4F30', accent: '#3E6B3A', spines: ['#2F5D50', '#E1D7BE', '#7A8F5A', '#5A6E7E', '#B39261'], text: '#22301F' },
  },
  {
    themeId: 'lavender-dream',
    name: '라벤더 드림',
    description: '라벤더 향 가득한\n몽글몽글한 오후',
    category: 'mood',
    palette: { wall: '#D9CBE6', shelf: '#A58DBE', shelfEdge: '#7F6898', accent: '#6B4E8C', spines: ['#5E4A7A', '#C9A46B', '#8C79A8', '#3E4E6E', '#B98AA8'], text: '#2E2240' },
  },
  {
    themeId: 'monotone-gray',
    name: '모노톤 그레이',
    description: '정돈된 회색 톤의\n미니멀 서재',
    category: 'modern',
    palette: { wall: '#D6D6D4', shelf: '#8F8F8C', shelfEdge: '#6B6B68', accent: '#3D3D3B', spines: ['#4A4A48', '#A9A9A6', '#6E6E6B', '#C4C4C1', '#2F2F2D'], text: '#1F1F1E' },
  },
];

export const DEFAULT_THEME_ID = LIBRARY_THEMES[0].themeId;
