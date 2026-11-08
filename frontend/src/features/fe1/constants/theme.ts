import { Platform } from 'react-native';

export const colors = {
  background: '#FAF6EF',
  surface: '#FFFCF7',
  surfaceMuted: '#F3ECE3',
  surfaceSunken: '#F2EADF',
  primary: '#2B5B41',
  primaryLight: '#467459',
  primarySoft: '#EEF1E8',
  primaryBorder: '#BFD0C3',
  text: '#1B1B1B',
  secondaryText: '#6E6A66',
  tertiaryText: '#A4A09B',
  border: '#ECE3D8',
  borderStrong: '#E1D6C8',
  danger: '#DC5A43',
  dangerSoft: '#FCE9E6',
  progressTrack: '#E9E3DC',
  star: '#EFA137',
  flag: '#F59A2B',
  overlay: 'rgba(23, 23, 23, 0.45)',
  onPrimary: '#FFFFFF',
  shelfWood: '#C08A55',
  shelfWoodDark: '#8E5F35',
  shelfLabel: '#FBE3C1',
  tagBackground: '#FFFDF9',
} as const;

export const spacing = { xxs: 2, xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const radius = { card: 20, button: 14, input: 12, pill: 999, cover: 6 } as const;

export const typography = {
  title: { fontSize: 22, fontWeight: '700' },
  heading: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 15, fontWeight: '400' },
  label: { fontSize: 14, fontWeight: '600' },
  caption: { fontSize: 13, fontWeight: '400' },
} as const;

/** 인용문(인상 깊은 문장, 책 한 줄 소개)에 쓰는 명조 계열 글꼴 */
export const serifFont = Platform.select<string | undefined>({
  web: '"Nanum Myeongjo", "AppleMyungjo", "Batang", serif',
  android: 'serif',
  default: undefined, // iOS에는 기본 한글 명조 글꼴이 없어 시스템 글꼴을 쓴다
});

/** 카드에 쓰는 부드러운 그림자 */
export const softShadow = Platform.select({
  web: { boxShadow: '0 2px 12px rgba(120, 90, 60, 0.07)' },
  default: { shadowColor: '#7A5A3C', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
}) as object;

/** 한글을 글자 단위가 아닌 어절 단위로 줄바꿈 (웹) */
export const keepAllWords = (Platform.OS === 'web' ? { wordBreak: 'keep-all' } : {}) as object;

/** 웹에서 입력창 포커스 테두리 제거 */
export const noWebOutline = (Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as object;

/** 터치 영역 최소 크기 */
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
