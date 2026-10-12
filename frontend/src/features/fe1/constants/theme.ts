export const colors = {
  background: '#FAF3E9',
  surface: '#FFF9F2',
  surfaceMuted: '#F3EBE0',
  primary: '#286247',
  primarySoft: '#E3EEE6',
  text: '#171717',
  secondaryText: '#62666B',
  tertiaryText: '#9A9590',
  border: '#E9DED1',
  danger: '#E75243',
  dangerSoft: '#FCE9E6',
  progressTrack: '#E9E3DB',
  star: '#F2A33A',
  flag: '#F2A33A',
  overlay: 'rgba(23, 23, 23, 0.45)',
  onPrimary: '#FFFFFF',
  shelfWood: '#C08A55',
  shelfWoodDark: '#8E5F35',
  tagBackground: '#FFFDF9',
} as const;

export const spacing = { xxs: 2, xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const radius = { card: 20, button: 14, input: 12, pill: 999, cover: 8 } as const;

export const typography = {
  title: { fontSize: 22, fontWeight: '700' },
  heading: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 15, fontWeight: '400' },
  label: { fontSize: 14, fontWeight: '600' },
  caption: { fontSize: 13, fontWeight: '400' },
} as const;

/** 터치 영역 최소 크기 */
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
