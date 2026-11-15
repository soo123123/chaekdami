import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { colors } from '../../constants/theme';

type IonName = ComponentProps<typeof Ionicons>['name'];
type McName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type Glyph = { set: 'ion'; glyph: IonName } | { set: 'mc'; glyph: McName };

const ion = (glyph: IonName): Glyph => ({ set: 'ion', glyph });
const mc = (glyph: McName): Glyph => ({ set: 'mc', glyph });

/** FE1 화면에서 쓰는 아이콘을 의미 이름으로 모아둔다. 아이콘 교체 시 이 표만 바꾼다. */
const GLYPHS = {
  back: ion('chevron-back'),
  more: ion('ellipsis-horizontal'),
  search: ion('search-outline'),
  scan: mc('scan-helper'),
  heart: ion('heart'),
  heartOutline: ion('heart-outline'),
  clock: ion('time-outline'),
  calendar: ion('calendar-clear-outline'),
  calendarCheck: mc('calendar-check-outline'),
  calendarGoal: mc('calendar-month-outline'),
  book: ion('book-outline'),
  bookOpen: mc('book-open-variant'),
  bookOpenOutline: mc('book-open-outline'),
  trash: ion('trash-outline'),
  bookmark: ion('bookmark-outline'),
  chevronRight: ion('chevron-forward'),
  chevronDown: ion('chevron-down'),
  chevronUp: ion('chevron-up'),
  star: ion('star'),
  plus: ion('add'),
  close: ion('close'),
  globe: ion('globe-outline'),
  flag: mc('flag-variant'),
  camera: ion('camera'),
  gallery: ion('images-outline'),
  image: ion('image'),
  pencil: mc('pencil-outline'),
  publisher: mc('bank-outline'),
  barcode: mc('barcode'),
  alarm: mc('alarm'),
  stats: ion('stats-chart-outline'),
  pause: ion('pause'),
  play: ion('play'),
  focus: mc('white-balance-sunny'),
  eye: ion('eye-outline'),
  check: ion('checkmark'),
  leaf: mc('leaf'),
  save: mc('content-save'),
  bulb: ion('bulb-outline'),
  record: mc('book-clock-outline'),
  palette: ion('color-palette-outline'),
} as const satisfies Record<string, Glyph>;

export type IconName = keyof typeof GLYPHS;

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

export function Icon({ name, size = 20, color = colors.text, style }: IconProps) {
  const glyph: Glyph = GLYPHS[name];
  const common = { size, color, style, accessibilityElementsHidden: true, importantForAccessibility: 'no' as const };
  return glyph.set === 'ion'
    ? <Ionicons name={glyph.glyph} {...common} />
    : <MaterialCommunityIcons name={glyph.glyph} {...common} />;
}
